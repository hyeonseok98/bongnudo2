create or replace function private.replace_archive_content(
  p_archive_id uuid,
  p_content jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_archive_season_id smallint;
  v_structure_mode text;
  v_chapter jsonb;
  v_chapter_id uuid;
  v_chapter_index bigint;
  v_item jsonb;
  v_item_index bigint;
begin
  select archive.season_id, archive.structure_mode
  into v_archive_season_id, v_structure_mode
  from public.archives as archive
  where archive.id = p_archive_id;

  if not found then
    raise exception 'archive_not_found' using errcode = 'P0001';
  end if;

  if v_structure_mode is null then
    raise exception 'system_archive_read_only' using errcode = 'P0001';
  end if;

  if jsonb_typeof(p_content) <> 'object'
    or jsonb_typeof(p_content -> 'chapters') <> 'array'
    or jsonb_array_length(p_content -> 'chapters') > 100
    or exists (
      select 1
      from jsonb_array_elements(p_content -> 'chapters') as chapter(value)
      where jsonb_typeof(chapter.value) <> 'object'
        or jsonb_typeof(chapter.value -> 'items') <> 'array'
        or nullif(btrim(chapter.value ->> 'title'), '') is null
        or length(chapter.value ->> 'title') > 160
        or (chapter.value -> 'description' <> 'null'::jsonb and jsonb_typeof(chapter.value -> 'description') <> 'string')
        or length(coalesce(chapter.value ->> 'description', '')) > 5000
    )
    or (
      select count(*)
      from jsonb_array_elements(p_content -> 'chapters') as chapter(value)
      cross join lateral jsonb_array_elements(chapter.value -> 'items') as item(value)
    ) > 500
  then
    raise exception 'archive_invalid_content' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_content -> 'chapters') as chapter(value)
    cross join lateral jsonb_array_elements(chapter.value -> 'items') as item(value)
    where jsonb_typeof(item.value) <> 'object'
      or (item.value ->> 'clipId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or (item.value -> 'note' <> 'null'::jsonb and jsonb_typeof(item.value -> 'note') <> 'string')
      or length(coalesce(item.value ->> 'note', '')) > 2000
  ) then
    raise exception 'archive_invalid_content' using errcode = '22023';
  end if;

  if (v_structure_mode = 'day_based' and exists (
    select 1 from jsonb_array_elements(p_content -> 'chapters') as chapter(value)
    where (chapter.value ->> 'seasonDayId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  )) or (v_structure_mode = 'freeform' and exists (
    select 1 from jsonb_array_elements(p_content -> 'chapters') as chapter(value)
    where chapter.value ? 'seasonDayId' and chapter.value -> 'seasonDayId' <> 'null'::jsonb
  )) then
    raise exception 'archive_invalid_chapter_structure' using errcode = '22023';
  end if;

  if v_structure_mode = 'day_based' and exists (
    select 1
    from jsonb_array_elements(p_content -> 'chapters') as chapter(value)
    left join public.season_days as season_day
      on season_day.id = (chapter.value ->> 'seasonDayId')::uuid
    where season_day.id is null or season_day.season_id <> v_archive_season_id
  ) then
    raise exception 'archive_season_day_mismatch' using errcode = '22023';
  end if;

  if exists (
    select 1
    from (
      select item.value ->> 'clipId' as clip_id
      from jsonb_array_elements(p_content -> 'chapters') as chapter(value)
      cross join lateral jsonb_array_elements(chapter.value -> 'items') as item(value)
      group by item.value ->> 'clipId'
      having count(*) > 1
    ) as duplicate_clips
  ) then
    raise exception 'archive_duplicate_clip' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_content -> 'chapters') as chapter(value)
    cross join lateral jsonb_array_elements(chapter.value -> 'items') as item(value)
    left join public.clips as clip on clip.id = (item.value ->> 'clipId')::uuid
    where clip.id is null or clip.season_id <> v_archive_season_id
  ) then
    raise exception 'archive_clip_season_mismatch' using errcode = '22023';
  end if;

  if v_structure_mode = 'day_based' and exists (
    select 1
    from jsonb_array_elements(p_content -> 'chapters') as chapter(value)
    cross join lateral jsonb_array_elements(chapter.value -> 'items') as item(value)
    join public.clips as clip on clip.id = (item.value ->> 'clipId')::uuid
    where clip.season_day_id is distinct from (chapter.value ->> 'seasonDayId')::uuid
  ) then
    raise exception 'archive_day_based_clip_mismatch' using errcode = '22023';
  end if;

  delete from public.archive_chapters where archive_id = p_archive_id;

  for v_chapter, v_chapter_index in
    select chapter.value, row_number() over (
      order by case when v_structure_mode = 'day_based' then season_day.day_number end nulls last, chapter.ordinality
    )
    from jsonb_array_elements(p_content -> 'chapters') with ordinality as chapter(value, ordinality)
    left join public.season_days as season_day on season_day.id = nullif(chapter.value ->> 'seasonDayId', '')::uuid
  loop
    v_chapter_id := gen_random_uuid();
    insert into public.archive_chapters (id, archive_id, title, description, sort_order, season_day_id)
    values (
      v_chapter_id, p_archive_id, btrim(v_chapter ->> 'title'),
      nullif(btrim(v_chapter ->> 'description'), ''), (v_chapter_index - 1)::smallint,
      case when v_structure_mode = 'day_based' then (v_chapter ->> 'seasonDayId')::uuid else null end
    );

    for v_item, v_item_index in
      select item.value, item.ordinality
      from jsonb_array_elements(v_chapter -> 'items') with ordinality as item(value, ordinality)
    loop
      insert into public.archive_items (archive_id, chapter_id, clip_id, sort_order, note)
      values (p_archive_id, v_chapter_id, (v_item ->> 'clipId')::uuid, (v_item_index - 1)::smallint, nullif(btrim(v_item ->> 'note'), ''));
    end loop;
  end loop;
end;
$$;

create function public.save_archive(
  p_actor_user_id uuid,
  p_archive_id uuid,
  p_base_revision integer,
  p_content jsonb,
  p_metadata jsonb default null
)
returns table (
  archive_id uuid,
  current_revision integer,
  snapshot jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_archive public.archives%rowtype;
  v_snapshot jsonb;
  v_next_revision integer;
begin
  if p_metadata is not null then
    perform private.assert_archive_metadata(p_metadata);
  end if;

  select *
  into v_archive
  from public.archives
  where id = p_archive_id
  for update;

  if not found then
    raise exception 'archive_not_found' using errcode = 'P0001';
  end if;

  if v_archive.deleted_at is not null then
    raise exception 'archive_deleted' using errcode = 'P0001';
  end if;

  if v_archive.archive_kind <> 'user' then
    raise exception 'system_archive_read_only' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.users
    where id = p_actor_user_id and status = 'active'
  ) then
    raise exception 'archive_user_not_active' using errcode = 'P0001';
  end if;

  if p_actor_user_id <> v_archive.owner_id then
    if p_metadata is not null then
      raise exception 'archive_metadata_forbidden' using errcode = 'P0001';
    end if;

    if not (
      v_archive.visibility = 'public'
      and v_archive.edit_policy = 'public_edit'
    ) then
      raise exception 'archive_content_forbidden' using errcode = 'P0001';
    end if;
  end if;

  if p_base_revision <> v_archive.current_revision then
    raise exception 'archive_revision_conflict' using errcode = 'P0001';
  end if;

  if p_metadata is not null then
    if p_metadata ->> 'structureMode' <> v_archive.structure_mode then
      raise exception 'archive_immutable_field_changed' using errcode = 'P0001';
    end if;

    update public.archives
    set title = btrim(p_metadata ->> 'title'),
        description = nullif(btrim(p_metadata ->> 'description'), ''),
        category = p_metadata ->> 'category',
        visibility = p_metadata ->> 'visibility',
        edit_policy = p_metadata ->> 'editPolicy',
        status = p_metadata ->> 'status',
        updated_at = now()
    where id = p_archive_id;
  end if;

  perform private.replace_archive_content(p_archive_id, p_content);
  v_snapshot := private.build_archive_snapshot(p_archive_id);
  v_next_revision := v_archive.current_revision + 1;

  update public.archives
  set current_revision = v_next_revision,
      updated_at = now()
  where id = p_archive_id;

  insert into public.archive_revisions (
    archive_id,
    revision_number,
    snapshot,
    created_by
  )
  values (
    p_archive_id,
    v_next_revision,
    v_snapshot,
    p_actor_user_id
  );

  return query
  select p_archive_id, v_next_revision, v_snapshot;
end;
$$;

revoke execute on function public.save_archive(uuid, uuid, integer, jsonb, jsonb)
from public, anon, authenticated;

grant execute on function public.save_archive(uuid, uuid, integer, jsonb, jsonb)
to service_role;
