do $$
declare
  v_invalid_count integer;
begin
  select count(*)
  into v_invalid_count
  from public.get_public_archive_page(p_limit => 25) as page
  join public.archives as archive
    on archive.id = page.archive_id
  where archive.visibility <> 'public'
    or archive.deleted_at is not null;

  if v_invalid_count <> 0 then
    raise exception '공개 목록에 private 또는 삭제된 아카이브가 포함되었습니다.';
  end if;
end;
$$;

do $$
declare
  v_cursor_id uuid;
  v_cursor_sort_at timestamptz;
  v_duplicate_count integer;
  v_first_page_count integer;
begin
  select count(*)
  into v_first_page_count
  from public.get_public_archive_page(p_limit => 25);

  if v_first_page_count <= 24 then
    raise notice '공개 아카이브가 25개 미만이라 혼합 keyset 경계 검증을 건너뜁니다.';
    return;
  end if;

  select page.archive_id, page.sort_at
  into v_cursor_id, v_cursor_sort_at
  from (
    select archive_id, sort_at
    from public.get_public_archive_page(p_limit => 24)
    order by sort_at desc, archive_id desc
  ) as page
  order by page.sort_at asc, page.archive_id asc
  limit 1;

  with first_page as (
    select page.archive_id
    from public.get_public_archive_page(p_limit => 24) as page
    order by page.sort_at desc, page.archive_id desc
  ),
  second_page as (
    select page.archive_id
    from public.get_public_archive_page(
      p_cursor_id => v_cursor_id,
      p_cursor_sort_at => v_cursor_sort_at,
      p_limit => 24
    ) as page
    order by page.sort_at desc, page.archive_id desc
  )
  select count(*)
  into v_duplicate_count
  from first_page
  join second_page using (archive_id);

  if v_duplicate_count <> 0 then
    raise exception '공개 아카이브 keyset 페이지 경계에 중복이 있습니다.';
  end if;
end;
$$;

do $$
declare
  v_participant_id uuid;
  v_invalid_count integer;
begin
  select clip.season_participant_id
  into v_participant_id
  from public.archives as archive
  join public.archive_items as item
    on item.archive_id = archive.id
  join public.clips as clip
    on clip.id = item.clip_id
  where archive.archive_kind = 'user'
    and archive.visibility = 'public'
    and archive.deleted_at is null
    and clip.season_participant_id is not null
  limit 1;

  if v_participant_id is null then
    raise notice '인물이 포함된 공개 사용자 아카이브가 없어 participant 필터 검증을 건너뜁니다.';
    return;
  end if;

  select count(*)
  into v_invalid_count
  from public.get_public_archive_page(
    p_participant_id => v_participant_id,
    p_type => 'user',
    p_limit => 25
  ) as page
  where not exists (
    select 1
    from public.archive_items as item
    join public.clips as clip
      on clip.id = item.clip_id
    where item.archive_id = page.archive_id
      and clip.season_participant_id = v_participant_id
  );

  if v_invalid_count <> 0 then
    raise exception '인물 필터 결과에 관계없는 사용자 아카이브가 포함되었습니다.';
  end if;
end;
$$;
