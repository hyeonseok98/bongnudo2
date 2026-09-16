alter table public.archives
  add column archive_kind text not null default 'user',
  add column system_participant_id uuid,
  add column structure_mode text;

alter table public.archives
  alter column owner_id drop not null,
  alter column current_revision drop not null,
  alter column current_revision drop default;

alter table public.archives
  add constraint archives_archive_kind_check
    check (archive_kind in ('user', 'system_character')),
  add constraint archives_structure_mode_check
    check (structure_mode is null or structure_mode in ('day_based', 'freeform')),
  add constraint archives_system_participant_same_season_fkey
    foreign key (system_participant_id, season_id)
    references public.season_participants (id, season_id)
    on delete restrict;

update public.archives
set structure_mode = 'freeform',
    current_revision = greatest(current_revision, 1)
where archive_kind = 'user';

alter table public.archives
  add constraint archives_kind_state_check
    check (
      (
        archive_kind = 'user'
        and owner_id is not null
        and current_revision >= 1
        and structure_mode in ('day_based', 'freeform')
        and system_participant_id is null
      )
      or (
        archive_kind = 'system_character'
        and owner_id is null
        and current_revision is null
        and structure_mode is null
        and system_participant_id is not null
        and visibility = 'public'
        and edit_policy = 'owner_only'
        and status = 'ongoing'
        and deleted_at is null
      )
    );

alter table public.archive_chapters
  add column season_day_id uuid,
  add constraint archive_chapters_season_day_id_fkey
    foreign key (season_day_id)
    references public.season_days (id)
    on delete restrict;

create unique index archive_chapters_archive_season_day_key
  on public.archive_chapters (archive_id, season_day_id)
  where season_day_id is not null;

create unique index archives_system_character_participant_key
  on public.archives (season_id, system_participant_id)
  where archive_kind = 'system_character';

create index clips_system_archive_lookup_idx
  on public.clips (season_id, season_participant_id, clip_created_at desc, id desc)
  where season_participant_id is not null;

create function private.enforce_archive_immutable_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.archive_kind is distinct from old.archive_kind
    or new.structure_mode is distinct from old.structure_mode
  then
    raise exception 'archive_immutable_field_changed' using errcode = 'P0001';
  end if;

  if old.archive_kind = 'system_character' and new is distinct from old then
    raise exception 'system_archive_read_only' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger archives_enforce_immutable_fields_trigger
before update on public.archives
for each row
execute function private.enforce_archive_immutable_fields();

create function private.create_system_character_archive(
  p_season_id smallint,
  p_participant_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.archives (
    owner_id,
    season_id,
    title,
    description,
    category,
    visibility,
    edit_policy,
    status,
    current_revision,
    archive_kind,
    system_participant_id,
    structure_mode
  )
  values (
    null,
    p_season_id,
    '시스템 인물 아카이브',
    null,
    'character',
    'public',
    'owner_only',
    'ongoing',
    null,
    'system_character',
    p_participant_id,
    null
  )
  on conflict (season_id, system_participant_id)
  where archive_kind = 'system_character'
  do nothing;
end;
$$;

create function private.ensure_system_character_archive_for_clip()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.season_participant_id is not null
    and (
      tg_op = 'INSERT'
      or old.season_participant_id is distinct from new.season_participant_id
    )
  then
    perform private.create_system_character_archive(
      new.season_id,
      new.season_participant_id
    );
  end if;

  return new;
end;
$$;

create trigger clips_ensure_system_character_archive_trigger
after insert or update of season_participant_id on public.clips
for each row
execute function private.ensure_system_character_archive_for_clip();

insert into public.archives (
  owner_id,
  season_id,
  title,
  description,
  category,
  visibility,
  edit_policy,
  status,
  current_revision,
  archive_kind,
  system_participant_id,
  structure_mode
)
select distinct on (clip.season_id, clip.season_participant_id)
  null,
  clip.season_id,
  '시스템 인물 아카이브',
  null,
  'character',
  'public',
  'owner_only',
  'ongoing',
  null,
  'system_character',
  clip.season_participant_id,
  null
from public.clips as clip
where clip.season_participant_id is not null
on conflict (season_id, system_participant_id)
where archive_kind = 'system_character'
do nothing;

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
    or length(p_metadata ->> 'title') > 160
    or (p_metadata -> 'description' <> 'null'::jsonb and jsonb_typeof(p_metadata -> 'description') <> 'string')
    or length(coalesce(p_metadata ->> 'description', '')) > 5000
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
        'id', chapter.id, 'title', chapter.title, 'description', chapter.description,
        'sortOrder', chapter.sort_order, 'seasonDayId', chapter.season_day_id,
        'items', coalesce((select jsonb_agg(jsonb_build_object('id', item.id, 'clipId', item.clip_id, 'sortOrder', item.sort_order, 'note', item.note) order by item.sort_order) from public.archive_items as item where item.chapter_id = chapter.id), '[]'::jsonb)
      ) order by chapter.sort_order)
      from public.archive_chapters as chapter where chapter.archive_id = archive.id
    ), '[]'::jsonb)
  ) from public.archives as archive where archive.id = p_archive_id;
$$;

create or replace function public.create_archive(p_actor_user_id uuid, p_season_id smallint, p_metadata jsonb, p_content jsonb)
returns table (archive_id uuid, current_revision integer, snapshot jsonb)
language plpgsql security definer set search_path = ''
as $$
declare v_archive_id uuid; v_snapshot jsonb;
begin
  perform private.assert_archive_metadata(p_metadata);
  if not exists (select 1 from public.users where id = p_actor_user_id and status = 'active') then raise exception 'archive_user_not_active' using errcode = 'P0001'; end if;
  insert into public.archives (owner_id, season_id, title, description, category, visibility, edit_policy, status, current_revision, archive_kind, structure_mode)
  values (p_actor_user_id, p_season_id, btrim(p_metadata ->> 'title'), nullif(btrim(p_metadata ->> 'description'), ''), p_metadata ->> 'category', p_metadata ->> 'visibility', p_metadata ->> 'editPolicy', p_metadata ->> 'status', 1, 'user', p_metadata ->> 'structureMode')
  returning id into v_archive_id;
  perform private.replace_archive_content(v_archive_id, p_content);
  v_snapshot := private.build_archive_snapshot(v_archive_id);
  insert into public.archive_revisions (archive_id, revision_number, snapshot, created_by) values (v_archive_id, 1, v_snapshot, p_actor_user_id);
  return query select v_archive_id, 1, v_snapshot;
end;
$$;

create or replace function public.save_archive_content(p_actor_user_id uuid, p_archive_id uuid, p_base_revision integer, p_content jsonb)
returns table (archive_id uuid, current_revision integer, snapshot jsonb)
language plpgsql security definer set search_path = ''
as $$
declare v_archive public.archives%rowtype; v_snapshot jsonb; v_next_revision integer;
begin
  select * into v_archive from public.archives where id = p_archive_id for update;
  if not found then raise exception 'archive_not_found' using errcode = 'P0001'; end if;
  if v_archive.archive_kind <> 'user' then raise exception 'system_archive_read_only' using errcode = 'P0001'; end if;
  if v_archive.deleted_at is not null then raise exception 'archive_deleted' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.users where id = p_actor_user_id and status = 'active') then raise exception 'archive_user_not_active' using errcode = 'P0001'; end if;
  if p_actor_user_id <> v_archive.owner_id and not (v_archive.visibility = 'public' and v_archive.edit_policy = 'public_edit') then raise exception 'archive_content_forbidden' using errcode = 'P0001'; end if;
  if p_base_revision <> v_archive.current_revision then raise exception 'archive_revision_conflict' using errcode = 'P0001'; end if;
  perform private.replace_archive_content(p_archive_id, p_content);
  v_snapshot := private.build_archive_snapshot(p_archive_id); v_next_revision := v_archive.current_revision + 1;
  update public.archives set current_revision = v_next_revision, updated_at = now() where id = p_archive_id;
  insert into public.archive_revisions (archive_id, revision_number, snapshot, created_by) values (p_archive_id, v_next_revision, v_snapshot, p_actor_user_id);
  return query select p_archive_id, v_next_revision, v_snapshot;
end;
$$;

create or replace function public.update_archive_metadata(p_actor_user_id uuid, p_archive_id uuid, p_base_revision integer, p_metadata jsonb)
returns table (archive_id uuid, current_revision integer, snapshot jsonb)
language plpgsql security definer set search_path = ''
as $$
declare v_archive public.archives%rowtype; v_snapshot jsonb; v_next_revision integer;
begin
  perform private.assert_archive_metadata(p_metadata);
  select * into v_archive from public.archives where id = p_archive_id for update;
  if not found then raise exception 'archive_not_found' using errcode = 'P0001'; end if;
  if v_archive.archive_kind <> 'user' then raise exception 'system_archive_read_only' using errcode = 'P0001'; end if;
  if v_archive.deleted_at is not null then raise exception 'archive_deleted' using errcode = 'P0001'; end if;
  if p_actor_user_id <> v_archive.owner_id then raise exception 'archive_metadata_forbidden' using errcode = 'P0001'; end if;
  if p_base_revision <> v_archive.current_revision then raise exception 'archive_revision_conflict' using errcode = 'P0001'; end if;
  if p_metadata ->> 'structureMode' <> v_archive.structure_mode then raise exception 'archive_immutable_field_changed' using errcode = 'P0001'; end if;
  update public.archives set title = btrim(p_metadata ->> 'title'), description = nullif(btrim(p_metadata ->> 'description'), ''), category = p_metadata ->> 'category', visibility = p_metadata ->> 'visibility', edit_policy = p_metadata ->> 'editPolicy', status = p_metadata ->> 'status', updated_at = now() where id = p_archive_id;
  v_snapshot := private.build_archive_snapshot(p_archive_id); v_next_revision := v_archive.current_revision + 1;
  update public.archives set current_revision = v_next_revision, updated_at = now() where id = p_archive_id;
  insert into public.archive_revisions (archive_id, revision_number, snapshot, created_by) values (p_archive_id, v_next_revision, v_snapshot, p_actor_user_id);
  return query select p_archive_id, v_next_revision, v_snapshot;
end;
$$;

create or replace function public.restore_archive_revision(p_actor_user_id uuid, p_archive_id uuid, p_base_revision integer, p_revision_number integer)
returns table (archive_id uuid, current_revision integer, snapshot jsonb)
language plpgsql security definer set search_path = ''
as $$
declare v_archive public.archives%rowtype; v_revision_snapshot jsonb; v_snapshot jsonb; v_next_revision integer;
begin
  select * into v_archive from public.archives where id = p_archive_id for update;
  if not found then raise exception 'archive_not_found' using errcode = 'P0001'; end if;
  if v_archive.archive_kind <> 'user' then raise exception 'system_archive_read_only' using errcode = 'P0001'; end if;
  if v_archive.deleted_at is not null then raise exception 'archive_deleted' using errcode = 'P0001'; end if;
  if p_actor_user_id <> v_archive.owner_id then raise exception 'archive_metadata_forbidden' using errcode = 'P0001'; end if;
  if p_base_revision <> v_archive.current_revision then raise exception 'archive_revision_conflict' using errcode = 'P0001'; end if;
  select revision.snapshot into v_revision_snapshot from public.archive_revisions as revision where revision.archive_id = p_archive_id and revision.revision_number = p_revision_number;
  if not found then raise exception 'archive_revision_not_found' using errcode = 'P0001'; end if;
  update public.archives set title = v_revision_snapshot #>> '{metadata,title}', description = nullif(v_revision_snapshot #>> '{metadata,description}', ''), category = v_revision_snapshot #>> '{metadata,category}', status = v_revision_snapshot #>> '{metadata,status}', updated_at = now() where id = p_archive_id;
  perform private.replace_archive_content(p_archive_id, jsonb_build_object('chapters', v_revision_snapshot -> 'chapters'));
  v_snapshot := private.build_archive_snapshot(p_archive_id); v_next_revision := v_archive.current_revision + 1;
  update public.archives set current_revision = v_next_revision, updated_at = now() where id = p_archive_id;
  insert into public.archive_revisions (archive_id, revision_number, snapshot, created_by) values (p_archive_id, v_next_revision, v_snapshot, p_actor_user_id);
  return query select p_archive_id, v_next_revision, v_snapshot;
end;
$$;

create or replace function public.soft_delete_archive(p_actor_user_id uuid, p_archive_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$ declare v_archive public.archives%rowtype; begin
  select * into v_archive from public.archives where id = p_archive_id for update;
  if not found then raise exception 'archive_not_found' using errcode = 'P0001'; end if;
  if v_archive.archive_kind <> 'user' then raise exception 'system_archive_read_only' using errcode = 'P0001'; end if;
  if p_actor_user_id <> v_archive.owner_id then raise exception 'archive_metadata_forbidden' using errcode = 'P0001'; end if;
  update public.archives set deleted_at = now(), updated_at = now() where id = p_archive_id and deleted_at is null;
end; $$;

create or replace function public.restore_archive(p_actor_user_id uuid, p_archive_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$ declare v_archive public.archives%rowtype; begin
  select * into v_archive from public.archives where id = p_archive_id for update;
  if not found then raise exception 'archive_not_found' using errcode = 'P0001'; end if;
  if v_archive.archive_kind <> 'user' then raise exception 'system_archive_read_only' using errcode = 'P0001'; end if;
  if p_actor_user_id <> v_archive.owner_id then raise exception 'archive_metadata_forbidden' using errcode = 'P0001'; end if;
  if v_archive.deleted_at is null then raise exception 'archive_not_deleted' using errcode = 'P0001'; end if;
  if v_archive.deleted_at < now() - interval '30 days' then raise exception 'archive_restore_window_expired' using errcode = 'P0001'; end if;
  update public.archives set deleted_at = null, updated_at = now() where id = p_archive_id;
end; $$;

revoke execute on function private.enforce_archive_immutable_fields() from public, anon, authenticated, service_role;
revoke execute on function private.create_system_character_archive(smallint, uuid) from public, anon, authenticated, service_role;
revoke execute on function private.ensure_system_character_archive_for_clip() from public, anon, authenticated, service_role;
