-- ============================================================================
-- Groups — the first schema in this project.
--
-- Model (decided 2026-09-13): a group IS a trip. Travel dates, documents and
-- chat hang directly off the group; there is no separate `trips` table.
--
-- Every table here has RLS enabled. The anon key ships inside the app bundle,
-- so a table without a policy is world-readable. Treat a missing policy as a
-- data leak, not a TODO.
--
-- Apply with `supabase db push`, or paste into the SQL editor in the dashboard.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles
--
-- `auth.users` is not readable from the client, so member lists need a mirror
-- of the name and avatar Google gave us. Populated by a trigger on signup.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Mirrors Google's user_metadata into profiles on signup, and keeps it fresh
-- when the provider hands us a newer name or picture.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
    set display_name = coalesce(excluded.display_name, public.profiles.display_name),
        avatar_url   = coalesce(excluded.avatar_url,   public.profiles.avatar_url),
        updated_at   = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();

-- Backfill anyone who signed in before this migration ran.
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- invite codes
--
-- 8 characters from an alphabet with no 0/O/1/I/L, so a code read aloud or
-- retyped from a screenshot does not land on the wrong group.
-- ---------------------------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for _ in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;

    exit when not exists (select 1 from public.groups g where g.invite_code = candidate);
  end loop;

  return candidate;
end;
$$;

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(btrim(title)) between 1 and 80),
  description text check (char_length(description) <= 500),
  -- Public URL into the `group-covers` storage bucket. Null renders a fallback.
  cover_url   text,
  invite_code text not null unique,
  created_by  uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.groups enable row level security;

create index if not exists groups_created_by_idx on public.groups (created_by);

-- ---------------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------------
-- `user_id` points at `profiles`, not `auth.users`, so PostgREST can embed the
-- member's name and avatar in the same request as the membership row. The
-- cascade still reaches auth.users through `profiles.id`.
create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

create index if not exists group_members_user_id_idx on public.group_members (user_id);

-- ---------------------------------------------------------------------------
-- Membership predicates
--
-- These MUST be security definer. A policy on `group_members` that itself
-- queries `group_members` re-enters the same policy and Postgres raises
-- "infinite recursion detected in policy". Reading the table from inside a
-- definer function bypasses RLS and breaks the cycle.
-- ---------------------------------------------------------------------------
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

-- True when the caller and p_user_id sit in at least one group together.
-- Gates who can read a profile row.
create or replace function public.shares_group_with(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid() and theirs.user_id = p_user_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Policies: profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles are visible to yourself and your group mates" on public.profiles;
create policy "profiles are visible to yourself and your group mates"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.shares_group_with(id));

drop policy if exists "you can update your own profile" on public.profiles;
create policy "you can update your own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Policies: groups
--
-- Note there is deliberately no policy letting a non-member select a group by
-- invite code. The pre-join preview goes through `get_group_preview()` below,
-- which returns a fixed, safe subset. A permissive policy here would expose
-- every column of every group to anyone who could guess a code.
-- ---------------------------------------------------------------------------
drop policy if exists "members can read their groups" on public.groups;
create policy "members can read their groups"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id));

drop policy if exists "signed-in users can create groups" on public.groups;
create policy "signed-in users can create groups"
  on public.groups for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "owners can update their group" on public.groups;
create policy "owners can update their group"
  on public.groups for update
  to authenticated
  using (public.is_group_owner(id))
  with check (public.is_group_owner(id));

drop policy if exists "owners can delete their group" on public.groups;
create policy "owners can delete their group"
  on public.groups for delete
  to authenticated
  using (public.is_group_owner(id));

-- ---------------------------------------------------------------------------
-- Policies: group_members
--
-- There is no INSERT policy on purpose. Membership is only ever created by the
-- creator trigger or by `join_group()`, both security definer. A client cannot
-- add itself — or anyone else — to a group directly.
-- ---------------------------------------------------------------------------
drop policy if exists "members can see who else is in the group" on public.group_members;
create policy "members can see who else is in the group"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "you can leave, and owners can remove members" on public.group_members;
create policy "you can leave, and owners can remove members"
  on public.group_members for delete
  to authenticated
  using (user_id = auth.uid() or public.is_group_owner(group_id));

-- ---------------------------------------------------------------------------
-- Creating a group enrols the creator as its owner, atomically.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- Keep `updated_at` honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_group_updated on public.groups;
create trigger on_group_updated
  before update on public.groups
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- get_group_preview(code)
--
-- Powers the pre-join screen: enough to decide whether to join, nothing more.
-- No member list, no invite code echo, no created_by id.
-- ---------------------------------------------------------------------------
create or replace function public.get_group_preview(p_invite_code text)
returns table (
  id             uuid,
  title          text,
  description    text,
  cover_url      text,
  member_count   bigint,
  host_name      text,
  created_at     timestamptz,
  already_member boolean
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    g.id,
    g.title,
    g.description,
    g.cover_url,
    (select count(*) from public.group_members m where m.group_id = g.id),
    host.display_name,
    g.created_at,
    exists (
      select 1 from public.group_members m
      where m.group_id = g.id and m.user_id = auth.uid()
    )
  from public.groups g
  left join public.profiles host on host.id = g.created_by
  where g.invite_code = upper(btrim(p_invite_code));
$$;

-- ---------------------------------------------------------------------------
-- join_group(code)
--
-- Instant join: holding the link is the authorisation. Idempotent, so a double
-- tap or a re-opened link is harmless. Returns the group id to navigate to.
-- ---------------------------------------------------------------------------
create or replace function public.join_group(p_invite_code text)
returns uuid
language plpgsql
security definer
volatile
set search_path = public, pg_temp
as $$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to join a group.'
      using errcode = '28000';
  end if;

  select g.id into v_group_id
  from public.groups g
  where g.invite_code = upper(btrim(p_invite_code));

  if v_group_id is null then
    raise exception 'That invite link is not valid any more.'
      using errcode = 'P0002';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return v_group_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- regenerate_invite_code(group_id)
--
-- Revokes the shared link. Anyone holding the old one can no longer join;
-- existing members are unaffected.
-- ---------------------------------------------------------------------------
create or replace function public.regenerate_invite_code(p_group_id uuid)
returns text
language plpgsql
security definer
volatile
set search_path = public, pg_temp
as $$
declare
  v_code text;
begin
  if not public.is_group_owner(p_group_id) then
    raise exception 'Only the group owner can reset the invite link.'
      using errcode = '42501';
  end if;

  v_code := public.generate_invite_code();

  update public.groups set invite_code = v_code where id = p_group_id;

  return v_code;
end;
$$;

-- Default must be declared after generate_invite_code() exists.
alter table public.groups
  alter column invite_code set default public.generate_invite_code();

-- ---------------------------------------------------------------------------
-- Grants. RLS decides the rows; these decide who may ask at all.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.groups to authenticated;
grant select, delete on public.group_members to authenticated;
grant select, update on public.profiles to authenticated;

grant execute on function public.get_group_preview(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;

-- The anon role gets nothing: every screen behind a group requires a session.
revoke all on public.groups from anon;
revoke all on public.group_members from anon;
revoke all on public.profiles from anon;
