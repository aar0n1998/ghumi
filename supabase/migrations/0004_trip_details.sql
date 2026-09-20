-- ============================================================================
-- Trip details and per-member availability.
--
-- Adds what the create-group screen now collects — travel dates, a location,
-- and whether the group is meant to be public — plus the table behind the
-- availability screen.
--
-- Apply AFTER 0001–0003. Idempotent: safe to re-run.
--
-- ONE THING TO READ BEFORE YOU SHIP THIS
--
-- `is_public` records intent only. It changes NO policy: a group marked public
-- is still invisible to non-members, exactly like a private one. Making public
-- groups discoverable means letting strangers read `groups` rows, which is a
-- deliberate security decision (and an Explore screen to show them in) — not
-- something to slip in behind a toggle. Until that decision is made, the
-- toggle is a stored preference and nothing more.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- groups: trip details
-- ---------------------------------------------------------------------------
alter table public.groups
  add column if not exists starts_on date,
  add column if not exists ends_on   date,
  add column if not exists location  text,
  add column if not exists is_public boolean not null default false;

-- `add constraint if not exists` does not exist in Postgres; guard by name.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'groups_dates_ordered'
  ) then
    alter table public.groups
      add constraint groups_dates_ordered
      check (starts_on is null or ends_on is null or ends_on >= starts_on);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'groups_location_length'
  ) then
    alter table public.groups
      add constraint groups_location_length
      check (location is null or char_length(btrim(location)) between 1 and 120);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- group_availability
--
-- One row per person per group: the window they could travel in. Nobody has a
-- row until they say so, and "no row" is a real state the UI shows — it means
-- "has not shared dates", not "unavailable".
--
-- Note this table DOES allow a client to insert its own row, unlike
-- `group_members`. That is not an inconsistency: membership is an authorisation
-- decision (hence trigger/RPC only), while availability is a statement about
-- yourself inside a group you are already in.
-- ---------------------------------------------------------------------------
create table if not exists public.group_availability (
  group_id   uuid not null references public.groups (id)   on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  starts_on  date not null,
  ends_on    date not null,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id),
  constraint group_availability_dates_ordered check (ends_on >= starts_on)
);

alter table public.group_availability enable row level security;

create index if not exists group_availability_user_id_idx
  on public.group_availability (user_id);

drop policy if exists "members can read the group's availability" on public.group_availability;
create policy "members can read the group's availability"
  on public.group_availability for select
  to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "you can add your own availability" on public.group_availability;
create policy "you can add your own availability"
  on public.group_availability for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_group_member(group_id));

drop policy if exists "you can change your own availability" on public.group_availability;
create policy "you can change your own availability"
  on public.group_availability for update
  to authenticated
  using (user_id = auth.uid() and public.is_group_member(group_id))
  with check (user_id = auth.uid() and public.is_group_member(group_id));

drop policy if exists "you can withdraw your own availability" on public.group_availability;
create policy "you can withdraw your own availability"
  on public.group_availability for delete
  to authenticated
  using (user_id = auth.uid());

drop trigger if exists on_group_availability_updated on public.group_availability;
create trigger on_group_availability_updated
  before update on public.group_availability
  for each row execute function public.touch_updated_at();

grant select, insert, update, delete on public.group_availability to authenticated;
revoke all on public.group_availability from anon;

-- ---------------------------------------------------------------------------
-- create_group() — now carries the trip details
--
-- The three-argument version is dropped and replaced rather than overloaded:
-- two functions whose extra arguments all have defaults are ambiguous to call
-- and Postgres refuses. Existing callers are unaffected — PostgREST sends
-- named arguments, so a client that still sends only title/description/cover
-- resolves to this function with the rest defaulted.
-- ---------------------------------------------------------------------------
drop function if exists public.create_group(text, text, text);

create or replace function public.create_group(
  p_title       text,
  p_description text default null,
  p_cover_url   text default null,
  p_starts_on   date default null,
  p_ends_on     date default null,
  p_location    text default null,
  p_is_public   boolean default false
)
returns table (
  id          uuid,
  title       text,
  description text,
  cover_url   text,
  invite_code text,
  starts_on   date,
  ends_on     date,
  location    text,
  is_public   boolean,
  created_at  timestamptz
)
language plpgsql
security definer
volatile
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_title   text := btrim(coalesce(p_title, ''));
  v_group   public.groups;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to create a group.'
      using errcode = '28000';
  end if;

  if char_length(v_title) = 0 then
    raise exception 'A group needs a title.'
      using errcode = '22000';
  end if;

  if char_length(v_title) > 80 then
    raise exception 'That title is too long (80 characters max).'
      using errcode = '22001';
  end if;

  if p_starts_on is not null and p_ends_on is not null and p_ends_on < p_starts_on then
    raise exception 'The end date cannot be before the start date.'
      using errcode = '22007';
  end if;

  insert into public.groups (
    title, description, cover_url, created_by, starts_on, ends_on, location, is_public
  )
  values (
    v_title,
    nullif(btrim(coalesce(p_description, '')), ''),
    nullif(btrim(coalesce(p_cover_url, '')), ''),
    v_user_id,
    p_starts_on,
    p_ends_on,
    nullif(btrim(coalesce(p_location, '')), ''),
    coalesce(p_is_public, false)
  )
  returning * into v_group;

  -- `on_group_created` has already enrolled the caller as owner by this point.
  return query
    select v_group.id, v_group.title, v_group.description, v_group.cover_url,
           v_group.invite_code, v_group.starts_on, v_group.ends_on,
           v_group.location, v_group.is_public, v_group.created_at;
end;
$$;

grant execute on function
  public.create_group(text, text, text, date, date, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- The pre-join preview gains the trip details a person needs in order to
-- decide whether to join at all — dates and place, nothing more.
--
-- Dropped and recreated rather than replaced: `create or replace function`
-- refuses to change a function's return type, and this one gains three
-- columns. Callers are unaffected — they read fields by name.
-- ---------------------------------------------------------------------------
drop function if exists public.get_group_preview(text);

create or replace function public.get_group_preview(p_invite_code text)
returns table (
  id             uuid,
  title          text,
  description    text,
  cover_url      text,
  member_count   bigint,
  host_name      text,
  created_at     timestamptz,
  already_member boolean,
  starts_on      date,
  ends_on        date,
  location       text
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
    ),
    g.starts_on,
    g.ends_on,
    g.location
  from public.groups g
  left join public.profiles host on host.id = g.created_by
  where g.invite_code = upper(btrim(p_invite_code));
$$;

grant execute on function public.get_group_preview(text) to authenticated;
