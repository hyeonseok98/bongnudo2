create or replace function public.get_public_archive_page(
  p_type text default 'all',
  p_query text default null,
  p_participant_id uuid default null,
  p_category text default null,
  p_status text default null,
  p_sort text default 'updated',
  p_cursor_sort_at timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 25
)
returns table (
  archive_id uuid,
  archive_kind text,
  title text,
  description text,
  category text,
  status text,
  owner_name text,
  system_participant_id uuid,
  system_participant_rp_name text,
  system_participant_streamer_name text,
  system_participant_profile_image_key text,
  clip_count bigint,
  first_clip_created_at timestamptz,
  last_clip_created_at timestamptz,
  representative_thumbnail_url text,
  updated_at timestamptz,
  published_at timestamptz,
  sort_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  with filtered_archives as (
    select
      archive.id,
      archive.archive_kind,
      archive.category,
      archive.created_at,
      archive.description,
      archive.published_at,
      archive.season_id,
      archive.status,
      archive.structure_mode,
      archive.system_participant_id,
      archive.title,
      archive.updated_at,
      owner.chzzk_channel_name as owner_name,
      participant.portrait_image_key as system_participant_profile_image_key,
      participant.rp_name as system_participant_rp_name,
      streamer.name as system_participant_streamer_name
    from public.archives as archive
    left join public.users as owner
      on owner.id = archive.owner_id
    left join public.season_participants as participant
      on participant.id = archive.system_participant_id
      and participant.season_id = archive.season_id
    left join public.streamers as streamer
      on streamer.id = participant.streamer_id
    where archive.visibility = 'public'
      and archive.deleted_at is null
      and (
        p_type = 'all'
        or (p_type = 'system' and archive.archive_kind = 'system_character')
        or (p_type = 'user' and archive.archive_kind = 'user')
      )
      and (
        p_type <> 'user'
        or p_category is null
        or archive.category = p_category
      )
      and (
        p_type <> 'user'
        or p_status is null
        or archive.status = p_status
      )
      and (
        p_participant_id is null
        or (
          archive.archive_kind = 'system_character'
          and archive.system_participant_id = p_participant_id
        )
        or (
          archive.archive_kind = 'user'
          and exists (
            select 1
            from public.archive_items as item
            join public.clips as clip
              on clip.id = item.clip_id
            where item.archive_id = archive.id
              and clip.season_participant_id = p_participant_id
          )
        )
      )
      and (
        p_query is null
        or (
          archive.archive_kind = 'user'
          and (
            archive.title ilike '%' || p_query || '%'
            or coalesce(archive.description, '') ilike '%' || p_query || '%'
          )
        )
        or (
          archive.archive_kind = 'system_character'
          and (
            coalesce(participant.rp_name, '') ilike '%' || p_query || '%'
            or coalesce(streamer.name, '') ilike '%' || p_query || '%'
          )
        )
      )
  ),
  user_item_rows as (
    select
      archive.id as archive_id,
      chapter.sort_order as chapter_sort_order,
      clip.clip_created_at,
      clip.thumbnail_url,
      item.id as item_id,
      item.sort_order as item_sort_order,
      season_day.day_number,
      archive.structure_mode
    from filtered_archives as archive
    join public.archive_items as item
      on item.archive_id = archive.id
    join public.archive_chapters as chapter
      on chapter.id = item.chapter_id
      and chapter.archive_id = archive.id
    join public.clips as clip
      on clip.id = item.clip_id
    left join public.season_days as season_day
      on season_day.id = chapter.season_day_id
    where archive.archive_kind = 'user'
  ),
  user_stats as (
    select
      archive_id,
      count(*)::bigint as clip_count,
      min(clip_created_at) as first_clip_created_at,
      max(clip_created_at) as last_clip_created_at,
      (
        array_agg(
          thumbnail_url
          order by
            case when structure_mode = 'day_based' then day_number end asc nulls last,
            case when structure_mode = 'freeform' then chapter_sort_order end asc nulls last,
            item_sort_order asc,
            item_id asc
        )
      )[1] as representative_thumbnail_url
    from user_item_rows
    group by archive_id
  ),
  system_stats as (
    select
      archive.id as archive_id,
      count(clip.id)::bigint as clip_count,
      min(clip.clip_created_at) as first_clip_created_at,
      max(clip.clip_created_at) as last_clip_created_at,
      (
        array_agg(
          clip.thumbnail_url
          order by clip.clip_created_at desc, clip.id desc
        ) filter (where clip.thumbnail_url is not null)
      )[1] as representative_thumbnail_url
    from filtered_archives as archive
    left join public.clips as clip
      on clip.season_id = archive.season_id
      and clip.season_participant_id = archive.system_participant_id
    where archive.archive_kind = 'system_character'
    group by archive.id
  ),
  ranked_archives as (
    select
      archive.id as archive_id,
      archive.archive_kind,
      archive.title,
      archive.description,
      archive.category,
      archive.status,
      archive.owner_name,
      archive.system_participant_id,
      archive.system_participant_rp_name,
      archive.system_participant_streamer_name,
      archive.system_participant_profile_image_key,
      coalesce(user_stats.clip_count, system_stats.clip_count, 0)::bigint as clip_count,
      coalesce(user_stats.first_clip_created_at, system_stats.first_clip_created_at) as first_clip_created_at,
      coalesce(user_stats.last_clip_created_at, system_stats.last_clip_created_at) as last_clip_created_at,
      coalesce(user_stats.representative_thumbnail_url, system_stats.representative_thumbnail_url) as representative_thumbnail_url,
      archive.updated_at,
      archive.published_at,
      case
        when p_sort = 'published' then coalesce(archive.published_at, archive.created_at)
        when archive.archive_kind = 'system_character' then coalesce(system_stats.last_clip_created_at, archive.updated_at)
        else archive.updated_at
      end as sort_at
    from filtered_archives as archive
    left join user_stats
      on user_stats.archive_id = archive.id
    left join system_stats
      on system_stats.archive_id = archive.id
  )
  select
    archive_id,
    archive_kind,
    title,
    description,
    category,
    status,
    owner_name,
    system_participant_id,
    system_participant_rp_name,
    system_participant_streamer_name,
    system_participant_profile_image_key,
    clip_count,
    first_clip_created_at,
    last_clip_created_at,
    representative_thumbnail_url,
    updated_at,
    published_at,
    sort_at
  from ranked_archives
  where p_cursor_sort_at is null
    or (sort_at, archive_id) < (p_cursor_sort_at, p_cursor_id)
  order by sort_at desc, archive_id desc
  limit least(greatest(p_limit, 1), 25);
$$;
