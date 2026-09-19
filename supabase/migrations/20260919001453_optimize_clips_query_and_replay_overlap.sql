create or replace function public.get_clip_historical_affiliations(
  p_participant_id uuid,
  p_season_id smallint,
  p_target_at timestamptz
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  v_affiliations jsonb := '{}'::jsonb;
  v_event record;
  v_organization_id text;
  v_target_date date;
begin
  if p_participant_id is null or p_target_at is null then
    return null;
  end if;

  v_target_date := (p_target_at at time zone 'Asia/Seoul')::date;

  for v_event in
    select
      event.event_type,
      event.event_date,
      event.event_at,
      event.from_role,
      event.to_role,
      from_organization.id as from_organization_id,
      to_organization.id as to_organization_id,
      coalesce(to_organization.id, from_organization.id) as target_organization_id,
      coalesce(to_organization.name, from_organization.name) as target_organization_name,
      coalesce(to_organization.slug, from_organization.slug) as target_organization_slug,
      case coalesce(to_organization.type, from_organization.type)
        when 'institution' then 'public-service'
        when 'public-service' then 'public-service'
        when 'business' then 'business'
        when 'illegal-business' then 'illegal-business'
        when 'gang' then 'gang'
        when 'crew' then 'crew'
        else null
      end as target_organization_category
    from public.character_career_events as event
    left join public.organizations as from_organization
      on from_organization.id = event.from_organization_id
    left join public.organizations as to_organization
      on to_organization.id = event.to_organization_id
    where event.season_id = p_season_id
      and event.participant_id = p_participant_id
    order by event.event_date asc, event.sequence_in_day asc
  loop
    if v_event.event_date > v_target_date then
      exit;
    end if;

    if v_event.event_date = v_target_date then
      if v_event.event_at is null then
        return null;
      end if;

      if v_event.event_at > p_target_at then
        exit;
      end if;
    end if;

    case v_event.event_type
      when 'join' then
        if v_event.to_organization_id is null or v_affiliations ? v_event.to_organization_id::text then
          return null;
        end if;

        v_affiliations := v_affiliations || jsonb_build_object(
          v_event.to_organization_id::text,
          jsonb_build_object(
            'organizationName', v_event.target_organization_name,
            'organizationSlug', v_event.target_organization_slug,
            'role', v_event.to_role,
            'category', v_event.target_organization_category
          )
        );
      when 'leave' then
        if v_event.from_organization_id is null or not v_affiliations ? v_event.from_organization_id::text then
          return null;
        end if;

        v_affiliations := v_affiliations - v_event.from_organization_id::text;
      when 'transfer' then
        if v_event.from_organization_id is null
          or v_event.to_organization_id is null
          or not v_affiliations ? v_event.from_organization_id::text
          or v_affiliations ? v_event.to_organization_id::text then
          return null;
        end if;

        v_affiliations := v_affiliations - v_event.from_organization_id::text;
        v_affiliations := v_affiliations || jsonb_build_object(
          v_event.to_organization_id::text,
          jsonb_build_object(
            'organizationName', v_event.target_organization_name,
            'organizationSlug', v_event.target_organization_slug,
            'role', v_event.to_role,
            'category', v_event.target_organization_category
          )
        );
      when 'demote', 'promote' then
        v_organization_id := v_event.target_organization_id::text;

        if v_organization_id is null or not v_affiliations ? v_organization_id then
          return null;
        end if;

        v_affiliations := jsonb_set(
          v_affiliations,
          array[v_organization_id, 'role'],
          to_jsonb(v_event.to_role),
          false
        );
      when 'appoint' then
        v_organization_id := v_event.target_organization_id::text;

        if v_organization_id is null then
          return null;
        end if;

        if v_affiliations ? v_organization_id then
          v_affiliations := jsonb_set(
            v_affiliations,
            array[v_organization_id, 'role'],
            to_jsonb(v_event.to_role),
            false
          );
        else
          v_affiliations := v_affiliations || jsonb_build_object(
            v_organization_id,
            jsonb_build_object(
              'organizationName', v_event.target_organization_name,
              'organizationSlug', v_event.target_organization_slug,
              'role', v_event.to_role,
              'category', v_event.target_organization_category
            )
          );
        end if;
      else
        continue;
    end case;
  end loop;

  return coalesce((
    select jsonb_agg(affiliation.value)
    from jsonb_each(v_affiliations) as affiliation(key, value)
  ), '[]'::jsonb);
end;
$function$;

create or replace function public.get_clip_page(
  p_cursor_clip_created_at timestamptz default null,
  p_cursor_id uuid default null,
  p_date_start timestamptz default null,
  p_date_end timestamptz default null,
  p_day_number integer default null,
  p_groups text[] default null,
  p_jobs text[] default null,
  p_participant_ids uuid[] default null,
  p_sort text default 'latest',
  p_tag_ids uuid[] default null,
  p_limit integer default 25
)
returns table (
  clip_id uuid,
  clip_created_at timestamptz,
  historical_affiliations jsonb
)
language sql
stable
security invoker
set search_path = ''
as $function$
  with recursive active_season as (
    select season.id
    from public.seasons as season
    where season.is_active = true
  ), selected_affiliations as (
    select affiliation.id
    from public.streamer_affiliations as affiliation
    where coalesce(cardinality(p_groups), 0) > 0
      and affiliation.slug = any(p_groups)

    union all

    select child.id
    from public.streamer_affiliations as child
    join selected_affiliations as parent
      on child.parent_affiliation_id = parent.id
  ), filtered_clips as (
    select
      clip.id,
      clip.clip_created_at,
      public.get_clip_historical_affiliations(
        clip.season_participant_id,
        clip.season_id,
        clip.clip_created_at
      ) as historical_affiliations
    from public.clips as clip
    left join public.season_days as season_day
      on season_day.id = clip.season_day_id
      and season_day.season_id = clip.season_id
    where clip.season_id = (select id from active_season)
      and clip.excluded_at is null
      and (p_day_number is null or season_day.day_number = p_day_number)
      and (p_date_start is null or clip.clip_created_at >= p_date_start)
      and (p_date_end is null or clip.clip_created_at < p_date_end)
      and (
        p_participant_ids is null
        or clip.season_participant_id = any(p_participant_ids)
      )
      and (
        coalesce(cardinality(p_groups), 0) = 0
        or exists (
          select 1
          from public.streamer_affiliation_memberships as membership
          join public.season_participants as participant
            on participant.streamer_id = membership.streamer_id
          join selected_affiliations as affiliation
            on affiliation.id = membership.affiliation_id
          where participant.id = clip.season_participant_id
        )
      )
      and (
        coalesce(cardinality(p_tag_ids), 0) = 0
        or exists (
          select 1
          from public.clip_tags as clip_tag
          where clip_tag.clip_id = clip.id
            and clip_tag.tag_id = any(p_tag_ids)
        )
      )
      and (
        coalesce(cardinality(p_jobs), 0) = 0
        or exists (
          select 1
          from jsonb_array_elements(
            public.get_clip_historical_affiliations(
              clip.season_participant_id,
              clip.season_id,
              clip.clip_created_at
            )
          ) as affiliation(value)
          where affiliation.value ->> 'organizationSlug' = any(p_jobs)
            or affiliation.value ->> 'category' = any(p_jobs)
        )
      )
      and (
        p_cursor_clip_created_at is null
        or p_cursor_id is null
        or (
          p_sort = 'oldest'
          and (
            clip.clip_created_at > p_cursor_clip_created_at
            or (
              clip.clip_created_at = p_cursor_clip_created_at
              and clip.id > p_cursor_id
            )
          )
        )
        or (
          p_sort = 'latest'
          and (
            clip.clip_created_at < p_cursor_clip_created_at
            or (
              clip.clip_created_at = p_cursor_clip_created_at
              and clip.id < p_cursor_id
            )
          )
        )
      )
  )
  select
    filtered_clips.id as clip_id,
    filtered_clips.clip_created_at,
    filtered_clips.historical_affiliations
  from filtered_clips
  order by
    case when p_sort = 'oldest' then filtered_clips.clip_created_at end asc,
    case when p_sort = 'oldest' then filtered_clips.id end asc,
    case when p_sort = 'latest' then filtered_clips.clip_created_at end desc,
    case when p_sort = 'latest' then filtered_clips.id end desc
  limit least(greatest(p_limit, 1), 100);
$function$;

create index clips_season_day_created_cursor_idx
  on public.clips (season_id, season_day_id, clip_created_at desc, id desc)
  where season_day_id is not null and excluded_at is null;

create or replace function public.assign_replay_season_day_from_overlap()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if new.season_day_id is not null
    or new.live_started_at is null
    or new.duration_seconds is null
    or new.duration_seconds <= 0 then
    return new;
  end if;

  select season_day.id
  into new.season_day_id
  from public.season_days as season_day
  where season_day.season_id = new.season_id
    and new.live_started_at < season_day.ends_at
    and new.live_started_at + make_interval(secs => new.duration_seconds) > season_day.starts_at
  order by
    least(
      new.live_started_at + make_interval(secs => new.duration_seconds),
      season_day.ends_at
    ) - greatest(new.live_started_at, season_day.starts_at) desc,
    season_day.starts_at asc
  limit 1;

  return new;
end;
$function$;

drop trigger if exists assign_replay_season_day_from_overlap on public.replays;

create trigger assign_replay_season_day_from_overlap
before insert or update of season_id, season_day_id, live_started_at, duration_seconds
on public.replays
for each row
execute function public.assign_replay_season_day_from_overlap();

with overlap_matches as (
  select
    replay.id,
    (
      select season_day.id
      from public.season_days as season_day
      where season_day.season_id = replay.season_id
        and replay.live_started_at < season_day.ends_at
        and replay.live_started_at + make_interval(secs => replay.duration_seconds) > season_day.starts_at
      order by
        least(
          replay.live_started_at + make_interval(secs => replay.duration_seconds),
          season_day.ends_at
        ) - greatest(replay.live_started_at, season_day.starts_at) desc,
        season_day.starts_at asc
      limit 1
    ) as season_day_id
  from public.replays as replay
  where replay.season_day_id is null
    and replay.live_started_at is not null
    and replay.duration_seconds is not null
    and replay.duration_seconds > 0
)
update public.replays as replay
set season_day_id = overlap_matches.season_day_id
from overlap_matches
where replay.id = overlap_matches.id
  and overlap_matches.season_day_id is not null;

revoke execute on function public.get_clip_historical_affiliations(uuid, smallint, timestamptz)
  from public;
revoke execute on function public.get_clip_page(timestamptz, uuid, timestamptz, timestamptz, integer, text[], text[], uuid[], text, uuid[], integer)
  from public;

grant execute on function public.get_clip_historical_affiliations(uuid, smallint, timestamptz)
  to anon, authenticated, service_role;
grant execute on function public.get_clip_page(timestamptz, uuid, timestamptz, timestamptz, integer, text[], text[], uuid[], text, uuid[], integer)
  to anon, authenticated, service_role;
