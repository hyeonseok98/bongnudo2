create function public.add_clip_tag(
  p_clip_id uuid,
  p_name text,
  p_created_by uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_name text := btrim(p_name);
  v_tag_id uuid;
begin
  if v_name is null or length(v_name) not between 1 and 20 then
    raise exception 'invalid_tag_name' using errcode = '22023';
  end if;

  perform 1
  from public.users as app_user
  where app_user.id = p_created_by
    and app_user.status = 'active';

  if not found then
    raise exception 'active_user_not_found' using errcode = 'P0001';
  end if;

  perform 1
  from public.clips as clip
  where clip.id = p_clip_id
  for update;

  if not found then
    raise exception 'clip_not_found' using errcode = 'P0001';
  end if;

  insert into public.tags (name, normalized_name)
  values (v_name, lower(v_name))
  on conflict (normalized_name) do update
    set name = public.tags.name
  returning id into v_tag_id;

  if exists (
    select 1
    from public.clip_tags as clip_tag
    where clip_tag.clip_id = p_clip_id
      and clip_tag.tag_id = v_tag_id
  ) then
    return v_tag_id;
  end if;

  insert into public.clip_tags (clip_id, tag_id, created_by)
  values (p_clip_id, v_tag_id, p_created_by);

  return v_tag_id;
end;
$function$;

revoke execute on function public.add_clip_tag(uuid, text, uuid)
  from public, anon, authenticated;

grant execute on function public.add_clip_tag(uuid, text, uuid)
  to service_role;

create function private.replay_matches_jobs(
  p_season_id smallint,
  p_participant_id uuid,
  p_target_time timestamptz,
  p_jobs text[]
)
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  v_active_organizations uuid[] := array[]::uuid[];
  v_event record;
  v_organization_id uuid;
  v_target_date date := (p_target_time at time zone 'Asia/Seoul')::date;
begin
  if p_participant_id is null or p_target_time is null or coalesce(cardinality(p_jobs), 0) = 0 then
    return false;
  end if;

  for v_event in
    select
      event.event_type,
      event.event_date,
      event.event_at,
      event.from_organization_id,
      event.to_organization_id
    from public.character_career_events as event
    where event.season_id = p_season_id
      and event.participant_id = p_participant_id
      and event.event_date <= v_target_date
      and event.event_type in ('appoint', 'demote', 'join', 'leave', 'promote', 'transfer')
    order by event.event_date, event.sequence_in_day
  loop
    if v_event.event_date = v_target_date then
      if v_event.event_at is null then
        return false;
      end if;

      if v_event.event_at > p_target_time then
        exit;
      end if;
    end if;

    case v_event.event_type
      when 'join' then
        if v_event.to_organization_id is null
          or v_event.to_organization_id = any(v_active_organizations) then
          return false;
        end if;

        v_active_organizations := array_append(v_active_organizations, v_event.to_organization_id);
      when 'leave' then
        if v_event.from_organization_id is null
          or not (v_event.from_organization_id = any(v_active_organizations)) then
          return false;
        end if;

        v_active_organizations := array_remove(v_active_organizations, v_event.from_organization_id);
      when 'transfer' then
        if v_event.from_organization_id is null
          or v_event.to_organization_id is null
          or not (v_event.from_organization_id = any(v_active_organizations))
          or v_event.to_organization_id = any(v_active_organizations) then
          return false;
        end if;

        v_active_organizations := array_remove(v_active_organizations, v_event.from_organization_id);
        v_active_organizations := array_append(v_active_organizations, v_event.to_organization_id);
      when 'demote', 'promote' then
        v_organization_id := coalesce(v_event.to_organization_id, v_event.from_organization_id);

        if v_organization_id is null
          or not (v_organization_id = any(v_active_organizations)) then
          return false;
        end if;
      when 'appoint' then
        v_organization_id := coalesce(v_event.to_organization_id, v_event.from_organization_id);

        if v_organization_id is null then
          return false;
        end if;

        if not (v_organization_id = any(v_active_organizations)) then
          v_active_organizations := array_append(v_active_organizations, v_organization_id);
        end if;
    end case;
  end loop;

  return exists (
    select 1
    from public.organizations as organization
    where organization.id = any(v_active_organizations)
      and (
        organization.slug = any(p_jobs)
        or case organization.type
          when 'institution' then 'public-service'
          when 'public-service' then 'public-service'
          when 'business' then 'business'
          when 'illegal-business' then 'illegal-business'
          when 'gang' then 'gang'
          when 'crew' then 'crew'
          else null
        end = any(p_jobs)
      )
  );
end;
$function$;

revoke execute on function private.replay_matches_jobs(smallint, uuid, timestamptz, text[])
  from public, anon, authenticated;

grant execute on function private.replay_matches_jobs(smallint, uuid, timestamptz, text[])
  to service_role;

create function public.get_replay_session_page(
  p_cursor_sort_at timestamptz default null,
  p_cursor_id uuid default null,
  p_date_start timestamptz default null,
  p_date_end timestamptz default null,
  p_day_number integer default null,
  p_jobs text[] default null,
  p_participant_ids uuid[] default null,
  p_limit integer default 25
)
returns table (
  session_id uuid,
  started_at timestamptz,
  ended_at timestamptz,
  sort_at timestamptz,
  replay_ids uuid[]
)
language sql
stable
security invoker
set search_path = ''
as $function$
  with active_season as (
    select season.id
    from public.seasons as season
    where season.is_active = true
  ), filtered_replays as materialized (
    select
      replay.id,
      replay.duration_seconds,
      replay.live_started_at,
      replay.season_day_id,
      replay.season_participant_id,
      replay.sort_at
    from public.replays as replay
    left join public.season_days as season_day
      on season_day.id = replay.season_day_id
      and season_day.season_id = replay.season_id
    where replay.season_id = (select id from active_season)
      and replay.season_day_id is not null
      and replay.excluded_at is null
      and (p_day_number is null or season_day.day_number = p_day_number)
      and (p_date_start is null or replay.sort_at >= p_date_start)
      and (p_date_end is null or replay.sort_at < p_date_end)
      and (p_participant_ids is null or replay.season_participant_id = any(p_participant_ids))
      and (
        coalesce(cardinality(p_jobs), 0) = 0
        or private.replay_matches_jobs(
          replay.season_id,
          replay.season_participant_id,
          replay.sort_at,
          p_jobs
        )
      )
  ), timed_replays as (
    select
      replay.*,
      replay.live_started_at
        + make_interval(secs => greatest(replay.duration_seconds, 0)) as replay_ended_at
    from filtered_replays as replay
    where replay.season_participant_id is not null
      and replay.live_started_at is not null
      and replay.duration_seconds is not null
  ), replay_boundaries as (
    select
      replay.*,
      max(replay.replay_ended_at) over (
        partition by replay.season_participant_id, replay.season_day_id
        order by replay.live_started_at, replay.id
        rows between unbounded preceding and 1 preceding
      ) as previous_max_end
    from timed_replays as replay
  ), replay_groups as (
    select
      replay.*,
      sum(
        case
          when replay.previous_max_end is null
            or replay.live_started_at > replay.previous_max_end + interval '15 minutes'
          then 1
          else 0
        end
      ) over (
        partition by replay.season_participant_id, replay.season_day_id
        order by replay.live_started_at, replay.id
        rows between unbounded preceding and current row
      ) as session_number
    from replay_boundaries as replay
  ), timed_sessions as (
    select
      (array_agg(replay.id order by replay.live_started_at, replay.id))[1] as session_id,
      min(replay.live_started_at) as started_at,
      max(replay.replay_ended_at) as ended_at,
      min(replay.live_started_at) as sort_at,
      array_agg(replay.id order by replay.live_started_at, replay.id) as replay_ids
    from replay_groups as replay
    group by replay.season_participant_id, replay.season_day_id, replay.session_number
  ), standalone_sessions as (
    select
      replay.id as session_id,
      replay.live_started_at as started_at,
      null::timestamptz as ended_at,
      replay.sort_at,
      array[replay.id]::uuid[] as replay_ids
    from filtered_replays as replay
    where replay.season_participant_id is null
      or replay.live_started_at is null
      or replay.duration_seconds is null
  ), sessions as (
    select * from timed_sessions
    union all
    select * from standalone_sessions
  )
  select
    session.session_id,
    session.started_at,
    session.ended_at,
    session.sort_at,
    session.replay_ids
  from sessions as session
  where p_cursor_id is null
    or (
      p_cursor_sort_at is not null
      and (
        session.sort_at < p_cursor_sort_at
        or (session.sort_at = p_cursor_sort_at and session.session_id < p_cursor_id)
        or session.sort_at is null
      )
    )
    or (
      p_cursor_sort_at is null
      and session.sort_at is null
      and session.session_id < p_cursor_id
    )
  order by session.sort_at desc nulls last, session.session_id desc
  limit least(greatest(p_limit, 1), 100);
$function$;

revoke execute on function public.get_replay_session_page(timestamptz, uuid, timestamptz, timestamptz, integer, text[], uuid[], integer)
  from public, anon, authenticated;

grant execute on function public.get_replay_session_page(timestamptz, uuid, timestamptz, timestamptz, integer, text[], uuid[], integer)
  to service_role;

create index replays_session_grouping_idx
  on public.replays (
    season_id,
    season_participant_id,
    season_day_id,
    live_started_at,
    id
  )
  where excluded_at is null
    and season_day_id is not null;
