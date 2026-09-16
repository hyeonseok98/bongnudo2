do $$
declare
  v_archive_id uuid;
  v_expected_count bigint;
  v_actual_count bigint;
begin
  select archive.id
  into v_archive_id
  from public.archives as archive
  where archive.archive_kind = 'system_character'
    and archive.visibility = 'public'
  limit 1;

  if v_archive_id is null then
    raise notice '시스템 아카이브가 없어 요약 범위 검증을 건너뜁니다.';
    return;
  end if;

  select count(*)
  into v_expected_count
  from public.clips as clip
  join public.archives as archive
    on archive.id = v_archive_id
    and clip.season_id = archive.season_id
    and clip.season_participant_id = archive.system_participant_id;

  select summary.clip_count
  into v_actual_count
  from public.get_system_archive_clip_summary(v_archive_id) as summary
  limit 1;

  if v_actual_count is distinct from v_expected_count then
    raise exception '시스템 아카이브 요약의 클립 수가 참가자 범위와 일치하지 않습니다.';
  end if;
end;
$$;

do $$
declare
  v_archive record;
  v_duplicate_count integer;
begin
  select archive.season_id, archive.system_participant_id
  into v_archive
  from public.archives as archive
  where archive.archive_kind = 'system_character'
    and archive.visibility = 'public'
  limit 1;

  if v_archive is null then
    raise notice '시스템 아카이브가 없어 keyset 경계 검증을 건너뜁니다.';
    return;
  end if;

  with first_page as (
    select clip.id, clip.clip_created_at
    from public.clips as clip
    where clip.season_id = v_archive.season_id
      and clip.season_participant_id = v_archive.system_participant_id
    order by clip.clip_created_at desc, clip.id desc
    limit 24
  ), cursor_row as (
    select clip_created_at, id
    from first_page
    order by clip_created_at asc, id asc
    limit 1
  ), second_page as (
    select clip.id
    from public.clips as clip
    cross join cursor_row
    where clip.season_id = v_archive.season_id
      and clip.season_participant_id = v_archive.system_participant_id
      and (clip.clip_created_at, clip.id) < (cursor_row.clip_created_at, cursor_row.id)
    order by clip.clip_created_at desc, clip.id desc
    limit 24
  )
  select count(*)
  into v_duplicate_count
  from first_page
  join second_page using (id);

  if v_duplicate_count <> 0 then
    raise exception '최신순 keyset 페이지 경계에 중복이 있습니다.';
  end if;
end;
$$;

do $$
declare
  v_archive record;
  v_duplicate_count integer;
begin
  select archive.season_id, archive.system_participant_id
  into v_archive
  from public.archives as archive
  where archive.archive_kind = 'system_character'
    and archive.visibility = 'public'
  limit 1;

  if v_archive is null then
    raise notice '시스템 아카이브가 없어 keyset 경계 검증을 건너뜁니다.';
    return;
  end if;

  with first_page as (
    select clip.id, clip.clip_created_at
    from public.clips as clip
    where clip.season_id = v_archive.season_id
      and clip.season_participant_id = v_archive.system_participant_id
    order by clip.clip_created_at asc, clip.id asc
    limit 24
  ), cursor_row as (
    select clip_created_at, id
    from first_page
    order by clip_created_at desc, id desc
    limit 1
  ), second_page as (
    select clip.id
    from public.clips as clip
    cross join cursor_row
    where clip.season_id = v_archive.season_id
      and clip.season_participant_id = v_archive.system_participant_id
      and (clip.clip_created_at, clip.id) > (cursor_row.clip_created_at, cursor_row.id)
    order by clip.clip_created_at asc, clip.id asc
    limit 24
  )
  select count(*)
  into v_duplicate_count
  from first_page
  join second_page using (id);

  if v_duplicate_count <> 0 then
    raise exception '오래된순 keyset 페이지 경계에 중복이 있습니다.';
  end if;
end;
$$;
