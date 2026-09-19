drop function public.get_clip_page(timestamptz, uuid, timestamptz, timestamptz, integer, text[], text[], uuid[], text, uuid[], integer);

create function public.get_clip_page(
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
  clip_created_at timestamptz
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
  ), selected_job_organizations as (
    select organization.id
    from public.organizations as organization
    where coalesce(cardinality(p_jobs), 0) > 0
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
  ), filtered_clips as (
    select
      clip.id,
      clip.clip_created_at
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
          from selected_job_organizations as organization
          cross join lateral (
            select event.event_type, event.to_organization_id
            from public.character_career_events as event
            where event.season_id = clip.season_id
              and event.participant_id = clip.season_participant_id
              and (
                event.event_date < (clip.clip_created_at at time zone 'Asia/Seoul')::date
                or (
                  event.event_date = (clip.clip_created_at at time zone 'Asia/Seoul')::date
                  and event.event_at is not null
                  and event.event_at <= clip.clip_created_at
                )
              )
              and (
                event.from_organization_id = organization.id
                or event.to_organization_id = organization.id
              )
            order by event.event_date desc, event.sequence_in_day desc
            limit 1
          ) as latest_event
          where latest_event.event_type <> 'leave'
            and not (
              latest_event.event_type = 'transfer'
              and latest_event.to_organization_id is distinct from organization.id
            )
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
  select filtered_clips.id as clip_id, filtered_clips.clip_created_at
  from filtered_clips
  order by
    case when p_sort = 'oldest' then filtered_clips.clip_created_at end asc,
    case when p_sort = 'oldest' then filtered_clips.id end asc,
    case when p_sort = 'latest' then filtered_clips.clip_created_at end desc,
    case when p_sort = 'latest' then filtered_clips.id end desc
  limit least(greatest(p_limit, 1), 100);
$function$;

revoke execute on function public.get_clip_page(timestamptz, uuid, timestamptz, timestamptz, integer, text[], text[], uuid[], text, uuid[], integer)
  from public;

grant execute on function public.get_clip_page(timestamptz, uuid, timestamptz, timestamptz, integer, text[], text[], uuid[], text, uuid[], integer)
  to anon, authenticated, service_role;
