create table public.live_current (
  season_participant_id uuid primary key,
  live_id bigint not null,
  live_title text not null,
  viewer_count integer not null,
  thumbnail_url text not null,
  live_started_at timestamptz,
  refreshed_at timestamptz not null,
  constraint live_current_season_participant_id_fkey
    foreign key (season_participant_id)
    references public.season_participants (id)
    on delete cascade,
  constraint live_current_viewer_count_check
    check (viewer_count >= 0)
);

create table public.live_refresh_state (
  singleton boolean primary key default true,
  refreshed_at timestamptz,
  lock_owner uuid,
  lock_expires_at timestamptz,
  constraint live_refresh_state_singleton_check
    check (singleton),
  constraint live_refresh_state_lock_pair_check
    check (
      (lock_owner is null and lock_expires_at is null)
      or (lock_owner is not null and lock_expires_at is not null)
    )
);

insert into public.live_refresh_state (singleton)
values (true);

alter table public.live_current enable row level security;
alter table public.live_refresh_state enable row level security;

revoke all privileges on table public.live_current
  from anon, authenticated;
revoke all privileges on table public.live_refresh_state
  from anon, authenticated;

grant select, insert, delete on table public.live_current
  to service_role;
grant select, update on table public.live_refresh_state
  to service_role;

create function public.try_acquire_live_refresh(
  p_run_id uuid,
  p_lease_seconds integer default 180
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  acquired boolean := false;
begin
  if p_lease_seconds < 1 then
    raise exception 'p_lease_seconds must be positive';
  end if;

  update public.live_refresh_state
  set
    lock_owner = p_run_id,
    lock_expires_at = clock_timestamp() + make_interval(secs => p_lease_seconds)
  where singleton = true
    and (
      lock_owner is null
      or lock_expires_at <= clock_timestamp()
    )
  returning true into acquired;

  return coalesce(acquired, false);
end;
$function$;

create function public.release_live_refresh(p_run_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $function$
  update public.live_refresh_state
  set
    lock_owner = null,
    lock_expires_at = null
  where singleton = true
    and lock_owner = p_run_id;
$function$;

create function public.replace_live_current(
  p_run_id uuid,
  p_live_streams jsonb,
  p_refreshed_at timestamptz
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  inserted_count integer;
  lease_valid boolean := false;
begin
  if jsonb_typeof(p_live_streams) <> 'array' then
    raise exception 'p_live_streams must be a JSON array';
  end if;

  update public.live_refresh_state
  set refreshed_at = p_refreshed_at
  where singleton = true
    and lock_owner = p_run_id
    and lock_expires_at > clock_timestamp()
  returning true into lease_valid;

  if not coalesce(lease_valid, false) then
    raise exception 'LIVE refresh lease is not active';
  end if;

  delete from public.live_current;

  insert into public.live_current (
    season_participant_id,
    live_id,
    live_title,
    viewer_count,
    thumbnail_url,
    live_started_at,
    refreshed_at
  )
  select
    stream.season_participant_id,
    stream.live_id,
    stream.live_title,
    stream.viewer_count,
    stream.thumbnail_url,
    stream.live_started_at,
    p_refreshed_at
  from jsonb_to_recordset(p_live_streams) as stream (
    season_participant_id uuid,
    live_id bigint,
    live_title text,
    viewer_count integer,
    thumbnail_url text,
    live_started_at timestamptz
  );

  get diagnostics inserted_count = row_count;

  return inserted_count;
end;
$function$;

revoke execute on function public.try_acquire_live_refresh(uuid, integer)
  from public, anon, authenticated;
revoke execute on function public.release_live_refresh(uuid)
  from public, anon, authenticated;
revoke execute on function public.replace_live_current(uuid, jsonb, timestamptz)
  from public, anon, authenticated;

grant execute on function public.try_acquire_live_refresh(uuid, integer)
  to service_role;
grant execute on function public.release_live_refresh(uuid)
  to service_role;
grant execute on function public.replace_live_current(uuid, jsonb, timestamptz)
  to service_role;
