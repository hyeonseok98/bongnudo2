create schema if not exists private;

create table public.archives (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  season_id smallint not null,
  title text not null,
  description text,
  category text not null,
  visibility text not null default 'private',
  edit_policy text not null default 'owner_only',
  status text not null default 'ongoing',
  current_revision integer not null default 0,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint archives_owner_id_fkey
    foreign key (owner_id)
    references public.users (id)
    on delete restrict,
  constraint archives_season_id_fkey
    foreign key (season_id)
    references public.seasons (id)
    on delete restrict,
  constraint archives_title_not_empty_check
    check (length(btrim(title)) between 1 and 160),
  constraint archives_description_length_check
    check (description is null or length(description) <= 5000),
  constraint archives_category_check
    check (category in ('character', 'incident', 'series', 'other')),
  constraint archives_visibility_check
    check (visibility in ('private', 'public')),
  constraint archives_edit_policy_check
    check (edit_policy in ('owner_only', 'public_edit')),
  constraint archives_visibility_edit_policy_check
    check (
      (visibility = 'private' and edit_policy = 'owner_only')
      or (visibility = 'public' and edit_policy in ('owner_only', 'public_edit'))
    ),
  constraint archives_status_check
    check (status in ('ongoing', 'completed')),
  constraint archives_current_revision_check
    check (current_revision >= 0),
  constraint archives_publication_state_check
    check (published_at is null or visibility = 'public')
);

create table public.archive_chapters (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null,
  title text not null,
  description text,
  sort_order smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint archive_chapters_archive_id_fkey
    foreign key (archive_id)
    references public.archives (id)
    on delete cascade,
  constraint archive_chapters_archive_id_id_key unique (archive_id, id),
  constraint archive_chapters_archive_id_sort_order_key unique (archive_id, sort_order),
  constraint archive_chapters_title_not_empty_check
    check (length(btrim(title)) between 1 and 160),
  constraint archive_chapters_description_length_check
    check (description is null or length(description) <= 5000),
  constraint archive_chapters_sort_order_check
    check (sort_order >= 0)
);

create table public.archive_items (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null,
  chapter_id uuid not null,
  clip_id uuid not null,
  sort_order smallint not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint archive_items_archive_chapter_fkey
    foreign key (archive_id, chapter_id)
    references public.archive_chapters (archive_id, id)
    on delete cascade,
  constraint archive_items_clip_id_fkey
    foreign key (clip_id)
    references public.clips (id)
    on delete restrict,
  constraint archive_items_archive_id_clip_id_key unique (archive_id, clip_id),
  constraint archive_items_chapter_id_sort_order_key unique (chapter_id, sort_order),
  constraint archive_items_note_length_check
    check (note is null or length(note) <= 2000),
  constraint archive_items_sort_order_check
    check (sort_order >= 0)
);

create table public.archive_revisions (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null,
  revision_number integer not null,
  snapshot jsonb not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint archive_revisions_archive_id_fkey
    foreign key (archive_id)
    references public.archives (id)
    on delete restrict,
  constraint archive_revisions_created_by_fkey
    foreign key (created_by)
    references public.users (id)
    on delete restrict,
  constraint archive_revisions_archive_id_revision_number_key unique (archive_id, revision_number),
  constraint archive_revisions_revision_number_check
    check (revision_number > 0),
  constraint archive_revisions_snapshot_object_check
    check (jsonb_typeof(snapshot) = 'object')
);

create index archives_owner_updated_at_idx
  on public.archives (owner_id, updated_at desc);

create index archives_public_created_at_idx
  on public.archives (created_at desc)
  where visibility = 'public' and deleted_at is null;

create index archive_items_archive_chapter_idx
  on public.archive_items (archive_id, chapter_id);

create index archive_revisions_archive_created_at_idx
  on public.archive_revisions (archive_id, created_at desc);

create function private.enforce_archive_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.visibility = 'public' and new.published_at is null then
    new.published_at := now();
  end if;

  if tg_op = 'UPDATE' and old.published_at is not null then
    if new.visibility <> 'public' then
      raise exception 'archive_cannot_be_private_after_publication' using errcode = 'P0001';
    end if;

    if new.published_at is distinct from old.published_at then
      raise exception 'archive_published_at_cannot_change' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger archives_enforce_publication_trigger
before insert or update of visibility, published_at
on public.archives
for each row
execute function private.enforce_archive_publication();

create function private.assert_archive_metadata(p_metadata jsonb)
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
        'title',
        'description',
        'category',
        'visibility',
        'editPolicy',
        'status'
      )
    )
    or nullif(btrim(p_metadata ->> 'title'), '') is null
    or length(p_metadata ->> 'title') > 160
    or (
      p_metadata -> 'description' <> 'null'::jsonb
      and jsonb_typeof(p_metadata -> 'description') <> 'string'
    )
    or length(coalesce(p_metadata ->> 'description', '')) > 5000
    or p_metadata ->> 'category' not in ('character', 'incident', 'series', 'other')
    or p_metadata ->> 'visibility' not in ('private', 'public')
    or p_metadata ->> 'editPolicy' not in ('owner_only', 'public_edit')
    or p_metadata ->> 'status' not in ('ongoing', 'completed')
    or (
      p_metadata ->> 'visibility' = 'private'
      and p_metadata ->> 'editPolicy' <> 'owner_only'
    )
  then
    raise exception 'archive_invalid_metadata' using errcode = '22023';
  end if;
end;
$$;

create function private.replace_archive_content(
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
  v_chapter jsonb;
  v_chapter_id uuid;
  v_chapter_index bigint;
  v_item jsonb;
  v_item_index bigint;
begin
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
        or (
          chapter.value -> 'description' <> 'null'::jsonb
          and jsonb_typeof(chapter.value -> 'description') <> 'string'
        )
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
      or (
        item.value -> 'note' <> 'null'::jsonb
        and jsonb_typeof(item.value -> 'note') <> 'string'
      )
      or length(coalesce(item.value ->> 'note', '')) > 2000
  ) then
    raise exception 'archive_invalid_content' using errcode = '22023';
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

  select archive.season_id
  into v_archive_season_id
  from public.archives as archive
  where archive.id = p_archive_id;

  if not found then
    raise exception 'archive_not_found' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_content -> 'chapters') as chapter(value)
    cross join lateral jsonb_array_elements(chapter.value -> 'items') as item(value)
    left join public.clips as clip
      on clip.id = (item.value ->> 'clipId')::uuid
    where clip.id is null or clip.season_id <> v_archive_season_id
  ) then
    raise exception 'archive_clip_season_mismatch' using errcode = '22023';
  end if;

  delete from public.archive_chapters
  where archive_id = p_archive_id;

  for v_chapter, v_chapter_index in
    select chapter.value, chapter.ordinality
    from jsonb_array_elements(p_content -> 'chapters') with ordinality as chapter(value, ordinality)
  loop
    v_chapter_id := gen_random_uuid();

    insert into public.archive_chapters (
      id,
      archive_id,
      title,
      description,
      sort_order
    )
    values (
      v_chapter_id,
      p_archive_id,
      btrim(v_chapter ->> 'title'),
      nullif(btrim(v_chapter ->> 'description'), ''),
      (v_chapter_index - 1)::smallint
    );

    for v_item, v_item_index in
      select item.value, item.ordinality
      from jsonb_array_elements(v_chapter -> 'items') with ordinality as item(value, ordinality)
    loop
      insert into public.archive_items (
        archive_id,
        chapter_id,
        clip_id,
        sort_order,
        note
      )
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

create function private.build_archive_snapshot(p_archive_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'metadata',
    jsonb_build_object(
      'title', archive.title,
      'description', archive.description,
      'category', archive.category,
      'status', archive.status
    ),
    'chapters',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', chapter.id,
            'title', chapter.title,
            'description', chapter.description,
            'sortOrder', chapter.sort_order,
            'items',
            coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'id', item.id,
                    'clipId', item.clip_id,
                    'sortOrder', item.sort_order,
                    'note', item.note
                  )
                  order by item.sort_order
                )
                from public.archive_items as item
                where item.chapter_id = chapter.id
              ),
              '[]'::jsonb
            )
          )
          order by chapter.sort_order
        )
        from public.archive_chapters as chapter
        where chapter.archive_id = archive.id
      ),
      '[]'::jsonb
    )
  )
  from public.archives as archive
  where archive.id = p_archive_id;
$$;

create function public.save_archive_content(
  p_actor_user_id uuid,
  p_archive_id uuid,
  p_base_revision integer,
  p_content jsonb
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

  if not exists (
    select 1
    from public.users
    where id = p_actor_user_id and status = 'active'
  ) then
    raise exception 'archive_user_not_active' using errcode = 'P0001';
  end if;

  if p_actor_user_id <> v_archive.owner_id
    and not (
      v_archive.visibility = 'public'
      and v_archive.edit_policy = 'public_edit'
    )
  then
    raise exception 'archive_content_forbidden' using errcode = 'P0001';
  end if;

  if p_base_revision <> v_archive.current_revision then
    raise exception 'archive_revision_conflict' using errcode = 'P0001';
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

create function public.update_archive_metadata(
  p_actor_user_id uuid,
  p_archive_id uuid,
  p_base_revision integer,
  p_metadata jsonb
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
  perform private.assert_archive_metadata(p_metadata);

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

  if p_actor_user_id <> v_archive.owner_id then
    raise exception 'archive_metadata_forbidden' using errcode = 'P0001';
  end if;

  if p_base_revision <> v_archive.current_revision then
    raise exception 'archive_revision_conflict' using errcode = 'P0001';
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

create function public.create_archive(
  p_actor_user_id uuid,
  p_season_id smallint,
  p_metadata jsonb,
  p_content jsonb
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
  v_archive_id uuid;
begin
  perform private.assert_archive_metadata(p_metadata);

  if not exists (
    select 1
    from public.users
    where id = p_actor_user_id and status = 'active'
  ) then
    raise exception 'archive_user_not_active' using errcode = 'P0001';
  end if;

  insert into public.archives (
    owner_id,
    season_id,
    title,
    description,
    category,
    visibility,
    edit_policy,
    status
  )
  values (
    p_actor_user_id,
    p_season_id,
    btrim(p_metadata ->> 'title'),
    nullif(btrim(p_metadata ->> 'description'), ''),
    p_metadata ->> 'category',
    p_metadata ->> 'visibility',
    p_metadata ->> 'editPolicy',
    p_metadata ->> 'status'
  )
  returning id into v_archive_id;

  return query
  select *
  from public.save_archive_content(
    p_actor_user_id,
    v_archive_id,
    0,
    p_content
  );
end;
$$;

create function public.restore_archive_revision(
  p_actor_user_id uuid,
  p_archive_id uuid,
  p_base_revision integer,
  p_revision_number integer
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
  v_revision_snapshot jsonb;
  v_snapshot jsonb;
  v_next_revision integer;
begin
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

  if p_actor_user_id <> v_archive.owner_id then
    raise exception 'archive_metadata_forbidden' using errcode = 'P0001';
  end if;

  if p_base_revision <> v_archive.current_revision then
    raise exception 'archive_revision_conflict' using errcode = 'P0001';
  end if;

  select revision.snapshot
  into v_revision_snapshot
  from public.archive_revisions as revision
  where revision.archive_id = p_archive_id
    and revision.revision_number = p_revision_number;

  if not found then
    raise exception 'archive_revision_not_found' using errcode = 'P0001';
  end if;

  update public.archives
  set title = v_revision_snapshot #>> '{metadata,title}',
      description = nullif(v_revision_snapshot #>> '{metadata,description}', ''),
      category = v_revision_snapshot #>> '{metadata,category}',
      status = v_revision_snapshot #>> '{metadata,status}',
      updated_at = now()
  where id = p_archive_id;

  perform private.replace_archive_content(
    p_archive_id,
    jsonb_build_object('chapters', v_revision_snapshot -> 'chapters')
  );

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

create function public.soft_delete_archive(
  p_actor_user_id uuid,
  p_archive_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
begin
  select owner_id
  into v_owner_id
  from public.archives
  where id = p_archive_id
  for update;

  if not found then
    raise exception 'archive_not_found' using errcode = 'P0001';
  end if;

  if p_actor_user_id <> v_owner_id then
    raise exception 'archive_metadata_forbidden' using errcode = 'P0001';
  end if;

  update public.archives
  set deleted_at = now(),
      updated_at = now()
  where id = p_archive_id
    and deleted_at is null;
end;
$$;

create function public.restore_archive(
  p_actor_user_id uuid,
  p_archive_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_archive public.archives%rowtype;
begin
  select *
  into v_archive
  from public.archives
  where id = p_archive_id
  for update;

  if not found then
    raise exception 'archive_not_found' using errcode = 'P0001';
  end if;

  if p_actor_user_id <> v_archive.owner_id then
    raise exception 'archive_metadata_forbidden' using errcode = 'P0001';
  end if;

  if v_archive.deleted_at is null then
    raise exception 'archive_not_deleted' using errcode = 'P0001';
  end if;

  if v_archive.deleted_at < now() - interval '30 days' then
    raise exception 'archive_restore_window_expired' using errcode = 'P0001';
  end if;

  update public.archives
  set deleted_at = null,
      updated_at = now()
  where id = p_archive_id;
end;
$$;

alter table public.archives enable row level security;
alter table public.archive_chapters enable row level security;
alter table public.archive_items enable row level security;
alter table public.archive_revisions enable row level security;

revoke all privileges on table
  public.archives,
  public.archive_chapters,
  public.archive_items,
  public.archive_revisions
from anon, authenticated;

grant select on table
  public.archives,
  public.archive_chapters,
  public.archive_items
to anon, authenticated;

grant select on table
  public.archives,
  public.archive_chapters,
  public.archive_items,
  public.archive_revisions
to service_role;

create policy "public archives are readable"
on public.archives for select
to anon, authenticated
using (visibility = 'public' and deleted_at is null);

create policy "public archive chapters are readable"
on public.archive_chapters for select
to anon, authenticated
using (
  exists (
    select 1
    from public.archives as archive
    where archive.id = archive_chapters.archive_id
      and archive.visibility = 'public'
      and archive.deleted_at is null
  )
);

create policy "public archive items are readable"
on public.archive_items for select
to anon, authenticated
using (
  exists (
    select 1
    from public.archives as archive
    where archive.id = archive_items.archive_id
      and archive.visibility = 'public'
      and archive.deleted_at is null
  )
);

revoke execute on function private.enforce_archive_publication()
from public, anon, authenticated, service_role;

revoke execute on function private.assert_archive_metadata(jsonb)
from public, anon, authenticated, service_role;

revoke execute on function private.replace_archive_content(uuid, jsonb)
from public, anon, authenticated, service_role;

revoke execute on function private.build_archive_snapshot(uuid)
from public, anon, authenticated, service_role;

revoke execute on function public.create_archive(uuid, smallint, jsonb, jsonb)
from public, anon, authenticated;

revoke execute on function public.save_archive_content(uuid, uuid, integer, jsonb)
from public, anon, authenticated;

revoke execute on function public.update_archive_metadata(uuid, uuid, integer, jsonb)
from public, anon, authenticated;

revoke execute on function public.restore_archive_revision(uuid, uuid, integer, integer)
from public, anon, authenticated;

revoke execute on function public.soft_delete_archive(uuid, uuid)
from public, anon, authenticated;

revoke execute on function public.restore_archive(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.create_archive(uuid, smallint, jsonb, jsonb)
to service_role;

grant execute on function public.save_archive_content(uuid, uuid, integer, jsonb)
to service_role;

grant execute on function public.update_archive_metadata(uuid, uuid, integer, jsonb)
to service_role;

grant execute on function public.restore_archive_revision(uuid, uuid, integer, integer)
to service_role;

grant execute on function public.soft_delete_archive(uuid, uuid)
to service_role;

grant execute on function public.restore_archive(uuid, uuid)
to service_role;
