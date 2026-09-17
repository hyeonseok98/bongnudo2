create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now(),
  constraint tags_name_length_check check (length(btrim(name)) between 1 and 20),
  constraint tags_normalized_name_key unique (normalized_name),
  constraint tags_normalized_name_not_empty_check check (length(btrim(normalized_name)) > 0)
);

create table public.clip_tags (
  clip_id uuid not null,
  tag_id uuid not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint clip_tags_pkey primary key (clip_id, tag_id),
  constraint clip_tags_clip_id_fkey
    foreign key (clip_id)
    references public.clips (id)
    on delete cascade,
  constraint clip_tags_tag_id_fkey
    foreign key (tag_id)
    references public.tags (id)
    on delete restrict,
  constraint clip_tags_created_by_fkey
    foreign key (created_by)
    references public.users (id)
    on delete restrict
);

create index clip_tags_tag_id_clip_id_idx
  on public.clip_tags (tag_id, clip_id);

create index clip_tags_clip_id_created_at_idx
  on public.clip_tags (clip_id, created_at);

create function private.normalize_tag_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  new.normalized_name := lower(new.name);

  return new;
end;
$$;

create trigger tags_normalize_name_trigger
before insert or update of name
on public.tags
for each row
execute function private.normalize_tag_name();

create function private.enforce_clip_tag_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform 1
  from public.clips
  where id = new.clip_id
  for update;

  if not found then
    raise exception 'clip_not_found' using errcode = 'P0001';
  end if;

  if (
    select count(*)
    from public.clip_tags
    where clip_id = new.clip_id
  ) >= 10 then
    raise exception 'clip_tag_limit_exceeded' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger clip_tags_enforce_limit_trigger
before insert
on public.clip_tags
for each row
execute function private.enforce_clip_tag_limit();

alter table public.tags enable row level security;
alter table public.clip_tags enable row level security;

grant select on public.tags, public.clip_tags to anon, authenticated;

create policy "tags are publicly readable"
on public.tags for select
to anon, authenticated
using (true);

create policy "clip tags are publicly readable"
on public.clip_tags for select
to anon, authenticated
using (true);

alter table public.archive_chapters
  add column story_type text not null default 'main',
  add constraint archive_chapters_story_type_check
    check (story_type in ('main', 'side'));

drop index if exists public.archive_chapters_archive_season_day_key;

alter table public.archives
  drop constraint archives_title_not_empty_check,
  drop constraint archives_description_length_check,
  add constraint archives_title_not_empty_check
    check (length(btrim(title)) between 1 and 60) not valid,
  add constraint archives_description_length_check
    check (description is null or length(description) <= 500) not valid;

alter table public.archive_chapters
  drop constraint archive_chapters_title_not_empty_check,
  drop constraint archive_chapters_description_length_check,
  add constraint archive_chapters_title_not_empty_check
    check (length(btrim(title)) between 1 and 50) not valid,
  add constraint archive_chapters_description_length_check
    check (description is null or length(description) <= 300) not valid;

alter table public.archive_items
  drop constraint archive_items_note_length_check,
  add constraint archive_items_note_length_check
    check (note is null or length(note) <= 300) not valid;

create or replace function private.assert_archive_metadata(
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if jsonb_typeof(p_metadata) <> 'object'
    or exists (
      select 1
      from jsonb_object_keys(p_metadata) as key(value)
      where key.value not in (
        'title', 'description', 'category', 'visibility', 'editPolicy', 'status', 'structureMode'
      )
    )
    or nullif(btrim(p_metadata ->> 'title'), '') is null
    or length(p_metadata ->> 'title') > 60
    or (p_metadata -> 'description' <> 'null'::jsonb and jsonb_typeof(p_metadata -> 'description') <> 'string')
    or length(coalesce(p_metadata ->> 'description', '')) > 500
    or p_metadata ->> 'category' not in ('character', 'incident', 'series', 'other')
    or p_metadata ->> 'visibility' not in ('private', 'public')
    or p_metadata ->> 'editPolicy' not in ('owner_only', 'public_edit')
    or p_metadata ->> 'status' not in ('ongoing', 'completed')
    or p_metadata ->> 'structureMode' not in ('day_based', 'freeform')
    or (p_metadata ->> 'visibility' = 'private' and p_metadata ->> 'editPolicy' <> 'owner_only')
  then
    raise exception 'archive_invalid_metadata' using errcode = '22023';
  end if;
end;
$$;

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
        or length(chapter.value ->> 'title') > 50
        or (chapter.value -> 'description' <> 'null'::jsonb and jsonb_typeof(chapter.value -> 'description') <> 'string')
        or length(coalesce(chapter.value ->> 'description', '')) > 300
        or (chapter.value ? 'storyType' and chapter.value ->> 'storyType' not in ('main', 'side'))
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
      or length(coalesce(item.value ->> 'note', '')) > 300
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

  delete from public.archive_chapters where archive_id = p_archive_id;

  for v_chapter, v_chapter_index in
    select chapter.value, row_number() over (
      order by case when v_structure_mode = 'day_based' then season_day.day_number end nulls last, chapter.ordinality
    )
    from jsonb_array_elements(p_content -> 'chapters') with ordinality as chapter(value, ordinality)
    left join public.season_days as season_day on season_day.id = nullif(chapter.value ->> 'seasonDayId', '')::uuid
  loop
    v_chapter_id := gen_random_uuid();
    insert into public.archive_chapters (
      id, archive_id, title, description, sort_order, season_day_id, story_type
    )
    values (
      v_chapter_id,
      p_archive_id,
      btrim(v_chapter ->> 'title'),
      nullif(btrim(v_chapter ->> 'description'), ''),
      (v_chapter_index - 1)::smallint,
      case when v_structure_mode = 'day_based' then (v_chapter ->> 'seasonDayId')::uuid else null end,
      coalesce(v_chapter ->> 'storyType', 'main')
    );

    for v_item, v_item_index in
      select item.value, item.ordinality
      from jsonb_array_elements(v_chapter -> 'items') with ordinality as item(value, ordinality)
    loop
      insert into public.archive_items (archive_id, chapter_id, clip_id, sort_order, note)
      values (
        p_archive_id,
        v_chapter_id,
        (v_item ->> 'clipId')::uuid,
        (v_item_index - 1)::smallint,
        nullif(btrim(v_item ->> 'note'), '')
      );
    end loop;
  end loop;
end;
$$;

create or replace function private.build_archive_snapshot(p_archive_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'metadata', jsonb_build_object('title', archive.title, 'description', archive.description, 'category', archive.category, 'status', archive.status),
    'chapters', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', chapter.id,
        'title', chapter.title,
        'description', chapter.description,
        'sortOrder', chapter.sort_order,
        'seasonDayId', chapter.season_day_id,
        'storyType', chapter.story_type,
        'items', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', item.id,
            'clipId', item.clip_id,
            'sortOrder', item.sort_order,
            'note', item.note
          ) order by item.sort_order)
          from public.archive_items as item
          where item.chapter_id = chapter.id
        ), '[]'::jsonb)
      ) order by chapter.sort_order)
      from public.archive_chapters as chapter
      where chapter.archive_id = archive.id
    ), '[]'::jsonb)
  )
  from public.archives as archive
  where archive.id = p_archive_id;
$$;
