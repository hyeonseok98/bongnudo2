create or replace function public.replace_live_current(
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

  delete from public.live_current
  where season_participant_id is not null;

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
