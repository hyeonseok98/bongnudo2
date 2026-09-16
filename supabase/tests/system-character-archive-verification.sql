begin;

create temporary table system_archive_verification_context (
  season_id smallint not null,
  participant_id uuid not null,
  streamer_id uuid not null,
  source_clip_id uuid not null
) on commit drop;

do $$
declare
  v_source public.clips%rowtype;
  v_archive_id uuid;
begin
  select *
  into v_source
  from public.clips
  where season_participant_id is not null
  order by created_at
  limit 1;

  if not found then
    raise exception 'system_archive_verification_clip_missing';
  end if;

  delete from public.archives
  where archive_kind = 'system_character'
    and season_id = v_source.season_id
    and system_participant_id = v_source.season_participant_id;

  insert into system_archive_verification_context
  values (
    v_source.season_id,
    v_source.season_participant_id,
    v_source.streamer_id,
    v_source.id
  );

  insert into public.clips (
    provider,
    provider_clip_id,
    provider_video_id,
    streamer_id,
    season_id,
    season_participant_id,
    season_day_id,
    title,
    thumbnail_url,
    clip_url,
    duration_seconds,
    view_count,
    clip_created_at,
    collected_at
  )
  select
    provider,
    provider_clip_id || '-system-archive-verification-a',
    provider_video_id,
    streamer_id,
    season_id,
    season_participant_id,
    season_day_id,
    title,
    thumbnail_url,
    clip_url,
    duration_seconds,
    view_count,
    clip_created_at,
    collected_at
  from public.clips
  where id = v_source.id;

  insert into public.clips (
    provider,
    provider_clip_id,
    provider_video_id,
    streamer_id,
    season_id,
    season_participant_id,
    season_day_id,
    title,
    thumbnail_url,
    clip_url,
    duration_seconds,
    view_count,
    clip_created_at,
    collected_at
  )
  select
    provider,
    provider_clip_id || '-system-archive-verification-b',
    provider_video_id,
    streamer_id,
    season_id,
    season_participant_id,
    season_day_id,
    title,
    thumbnail_url,
    clip_url,
    duration_seconds,
    view_count,
    clip_created_at,
    collected_at
  from public.clips
  where id = v_source.id;

  select id
  into v_archive_id
  from public.archives
  where archive_kind = 'system_character'
    and season_id = v_source.season_id
    and system_participant_id = v_source.season_participant_id;

  if (select count(*) from public.archives where archive_kind = 'system_character' and season_id = v_source.season_id and system_participant_id = v_source.season_participant_id) <> 1 then
    raise exception 'system_archive_verification_duplicate_created';
  end if;

  if exists (select 1 from public.archive_items where archive_id = v_archive_id)
    or exists (select 1 from public.archive_revisions where archive_id = v_archive_id)
  then
    raise exception 'system_archive_verification_static_content_created';
  end if;

  if (select count(*) from public.clips where season_id = v_source.season_id and season_participant_id = v_source.season_participant_id) < 2 then
    raise exception 'system_archive_verification_clip_not_available';
  end if;
end;
$$;

rollback;
