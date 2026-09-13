-- ============================================================================
-- Fix: creating a group failed with
--   "new row violates row-level security policy for table groups"
--
-- Cause: the client sent `INSERT ... RETURNING` (what `.insert().select()`
-- compiles to). When a table has SELECT policies, Postgres requires the new row
-- to satisfy them before it will hand it back through RETURNING. The SELECT
-- policy on `groups` is `is_group_member(id)`, and the membership row is created
-- by the AFTER INSERT trigger, which has not fired at the point RETURNING is
-- evaluated. So the row was invisible to its own creator and the insert aborted.
--
-- A plain INSERT with no RETURNING always worked, which is why the original
-- RLS test suite passed while the app was broken.
--
-- Fix: create groups through a security-definer RPC. It runs as the function
-- owner, so RLS does not gate the RETURNING, and the group plus its owner
-- membership are created in one atomic call.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

create or replace function public.create_group(
  p_title       text,
  p_description text default null,
  p_cover_url   text default null
)
returns table (
  id          uuid,
  title       text,
  description text,
  cover_url   text,
  invite_code text,
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

  insert into public.groups (title, description, cover_url, created_by)
  values (
    v_title,
    nullif(btrim(coalesce(p_description, '')), ''),
    nullif(btrim(coalesce(p_cover_url, '')), ''),
    v_user_id
  )
  returning * into v_group;

  -- `on_group_created` has already enrolled the caller as owner by this point.
  return query
    select v_group.id, v_group.title, v_group.description,
           v_group.cover_url, v_group.invite_code, v_group.created_at;
end;
$$;

grant execute on function public.create_group(text, text, text) to authenticated;

-- Direct inserts are no longer how groups are made. Removing the policy and the
-- grant means a client cannot bypass the validation in create_group().
drop policy if exists "signed-in users can create groups" on public.groups;
revoke insert on public.groups from authenticated;
