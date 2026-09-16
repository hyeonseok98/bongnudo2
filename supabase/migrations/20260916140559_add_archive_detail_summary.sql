create function public.get_system_archive_clip_summary(p_archive_id uuid)
returns table (
  clip_count bigint,
  first_clip_created_at timestamptz,
  last_clip_created_at timestamptz,
  season_day_id uuid,
  day_number integer,
  session_date date
)
language sql
security invoker
set search_path = ''
as $$
  with valid_archive as (
    select
      archive.season_id,
      archive.system_participant_id
    from public.archives as archive
    where archive.id = p_archive_id
      and archive.archive_kind = 'system_character'
      and archive.visibility = 'public'
      and archive.deleted_at is null
  ), source_clips as (
    select
      clip.clip_created_at,
      clip.season_day_id
    from valid_archive as archive
    join public.clips as clip
      on clip.season_id = archive.season_id
      and clip.season_participant_id = archive.system_participant_id
  ), summary as (
    select
      count(*) as clip_count,
      min(clip_created_at) as first_clip_created_at,
      max(clip_created_at) as last_clip_created_at
    from source_clips
  ), season_day_options as (
    select distinct
      season_day.id as season_day_id,
      season_day.day_number,
      season_day.session_date
    from source_clips
    join public.season_days as season_day
      on season_day.id = source_clips.season_day_id
  )
  select
    summary.clip_count,
    summary.first_clip_created_at,
    summary.last_clip_created_at,
    season_day_options.season_day_id,
    season_day_options.day_number,
    season_day_options.session_date
  from valid_archive
  cross join summary
  left join season_day_options on true
  order by season_day_options.day_number asc nulls last;
$$;

revoke execute on function public.get_system_archive_clip_summary(uuid)
from public, anon, authenticated;

grant execute on function public.get_system_archive_clip_summary(uuid)
to service_role;
