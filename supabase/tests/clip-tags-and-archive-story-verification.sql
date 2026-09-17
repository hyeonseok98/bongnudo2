begin;

-- 1. 같은 클립의 정규화된 태그 연결은 하나만 유지됩니다.
do $$
declare
  v_clip_id uuid;
  v_tag_id uuid;
  v_user_id uuid;
begin
  select id into v_clip_id from public.clips limit 1;
  select id into v_user_id from public.users limit 1;

  if v_clip_id is null or v_user_id is null then
    raise exception 'clip_tag_verification_fixture_missing';
  end if;

  insert into public.tags (name, normalized_name)
  values (' verification-tag ', 'verification-tag')
  returning id into v_tag_id;

  if not exists (
    select 1
    from public.tags
    where id = v_tag_id
      and name = 'verification-tag'
      and normalized_name = 'verification-tag'
  ) then
    raise exception 'clip_tag_normalization_failed';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename in ('tags', 'clip_tags')
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
  ) then
    raise exception 'clip_tag_browser_write_policy_exists';
  end if;

  insert into public.clip_tags (clip_id, tag_id, created_by)
  values (v_clip_id, v_tag_id, v_user_id);

  begin
    insert into public.clip_tags (clip_id, tag_id, created_by)
    values (v_clip_id, v_tag_id, v_user_id);
    raise exception 'clip_tag_duplicate_allowed';
  exception
    when unique_violation then null;
  end;
end;
$$;

-- 2. day_based 아카이브는 한 일차에 여러 chapter를 저장할 수 있습니다.
do $$
declare
  v_archive_id uuid;
  v_day_id uuid;
  v_owner_id uuid;
  v_season_id smallint;
begin
  select id into v_owner_id from public.users limit 1;
  select id into v_season_id from public.seasons where is_active = true limit 1;
  select id into v_day_id from public.season_days where season_id = v_season_id order by day_number limit 1;

  if v_owner_id is null or v_season_id is null or v_day_id is null then
    raise exception 'archive_story_verification_fixture_missing';
  end if;

  select archive_id into v_archive_id
  from public.create_archive(
    v_owner_id,
    v_season_id,
    '{"title":"story verification","description":null,"category":"other","visibility":"private","editPolicy":"owner_only","status":"ongoing","structureMode":"day_based"}'::jsonb,
    jsonb_build_object('chapters', jsonb_build_array(
      jsonb_build_object('title', '메인', 'description', null, 'seasonDayId', v_day_id, 'storyType', 'main', 'items', '[]'::jsonb),
      jsonb_build_object('title', '사이드', 'description', null, 'seasonDayId', v_day_id, 'storyType', 'side', 'items', '[]'::jsonb)
    ))
  );

  if (select count(*) from public.archive_chapters where archive_id = v_archive_id) <> 2 then
    raise exception 'archive_same_day_multiple_chapters_failed';
  end if;
end;
$$;

-- 3. revision snapshot은 storyType을 보존합니다.
do $$
declare
  v_archive_id uuid;
  v_day_id uuid;
  v_owner_id uuid;
  v_revision integer;
  v_season_id smallint;
begin
  select id into v_owner_id from public.users limit 1;
  select id into v_season_id from public.seasons where is_active = true limit 1;
  select id into v_day_id from public.season_days where season_id = v_season_id order by day_number limit 1;

  select archive_id, current_revision into v_archive_id, v_revision
  from public.create_archive(
    v_owner_id,
    v_season_id,
    '{"title":"snapshot verification","description":null,"category":"other","visibility":"private","editPolicy":"owner_only","status":"ongoing","structureMode":"day_based"}'::jsonb,
    jsonb_build_object('chapters', jsonb_build_array(
      jsonb_build_object('title', '사이드', 'description', null, 'seasonDayId', v_day_id, 'storyType', 'side', 'items', '[]'::jsonb)
    ))
  );

  perform public.restore_archive_revision(
    v_owner_id,
    v_archive_id,
    v_revision,
    v_revision
  );

  if not exists (
    select 1
    from public.archive_revisions
    where archive_id = v_archive_id
      and revision_number = v_revision + 1
      and snapshot #>> '{chapters,0,storyType}' = 'side'
  ) then
    raise exception 'archive_story_type_restore_missing';
  end if;
end;
$$;

rollback;
