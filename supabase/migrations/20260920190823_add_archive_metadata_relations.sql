do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'archives_id_season_id_key'
      and conrelid = 'public.archives'::regclass
  ) then
    alter table public.archives
      add constraint archives_id_season_id_key unique (id, season_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'season_days_id_season_id_key'
      and conrelid = 'public.season_days'::regclass
  ) then
    alter table public.season_days
      add constraint season_days_id_season_id_key unique (id, season_id);
  end if;
end;
$$;

create table public.archive_day_relations (
  archive_id uuid not null,
  season_id smallint not null,
  season_day_id uuid not null,
  created_at timestamptz not null default now(),
  constraint archive_day_relations_pkey primary key (archive_id, season_day_id),
  constraint archive_day_relations_archive_same_season_fkey
    foreign key (archive_id, season_id)
    references public.archives (id, season_id)
    on delete cascade,
  constraint archive_day_relations_day_same_season_fkey
    foreign key (season_day_id, season_id)
    references public.season_days (id, season_id)
    on delete restrict
);

create table public.archive_participant_relations (
  archive_id uuid not null,
  season_id smallint not null,
  season_participant_id uuid not null,
  created_at timestamptz not null default now(),
  constraint archive_participant_relations_pkey
    primary key (archive_id, season_participant_id),
  constraint archive_participant_relations_archive_same_season_fkey
    foreign key (archive_id, season_id)
    references public.archives (id, season_id)
    on delete cascade,
  constraint archive_participant_relations_participant_same_season_fkey
    foreign key (season_participant_id, season_id)
    references public.season_participants (id, season_id)
    on delete restrict
);

create index archive_day_relations_day_archive_idx
  on public.archive_day_relations (season_day_id, archive_id);

create index archive_participant_relations_participant_archive_idx
  on public.archive_participant_relations (season_participant_id, archive_id);

alter table public.archive_day_relations enable row level security;
alter table public.archive_participant_relations enable row level security;

revoke all privileges on table
  public.archive_day_relations,
  public.archive_participant_relations
from anon, authenticated;

grant select on table
  public.archive_day_relations,
  public.archive_participant_relations
to anon, authenticated;

grant all privileges on table
  public.archive_day_relations,
  public.archive_participant_relations
to service_role;

create policy "public archive day relations are readable"
on public.archive_day_relations for select
to anon, authenticated
using (
  exists (
    select 1
    from public.archives as archive
    where archive.id = archive_day_relations.archive_id
      and archive.visibility = 'public'
      and archive.deleted_at is null
  )
);

create policy "public archive participant relations are readable"
on public.archive_participant_relations for select
to anon, authenticated
using (
  exists (
    select 1
    from public.archives as archive
    where archive.id = archive_participant_relations.archive_id
      and archive.visibility = 'public'
      and archive.deleted_at is null
  )
);

insert into public.archive_day_relations (archive_id, season_id, season_day_id)
select distinct archive.id, archive.season_id, chapter.season_day_id
from public.archives as archive
join public.archive_chapters as chapter
  on chapter.archive_id = archive.id
where archive.archive_kind = 'user'
  and chapter.season_day_id is not null
on conflict (archive_id, season_day_id) do nothing;

insert into public.archive_participant_relations (
  archive_id,
  season_id,
  season_participant_id
)
select archive.id, archive.season_id, archive.system_participant_id
from public.archives as archive
where archive.archive_kind = 'system_character'
  and archive.system_participant_id is not null
on conflict (archive_id, season_participant_id) do nothing;

create or replace function private.assert_archive_metadata(p_metadata jsonb)
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
        'status',
        'structureMode',
        'relatedSeasonDayIds',
        'relatedParticipantIds'
      )
    )
    or nullif(btrim(p_metadata ->> 'title'), '') is null
    or length(p_metadata ->> 'title') > 60
    or (
      p_metadata -> 'description' <> 'null'::jsonb
      and jsonb_typeof(p_metadata -> 'description') <> 'string'
    )
    or length(coalesce(p_metadata ->> 'description', '')) > 500
    or p_metadata ->> 'category' not in ('character', 'incident', 'series', 'other')
    or p_metadata ->> 'visibility' not in ('private', 'public')
    or p_metadata ->> 'editPolicy' not in ('owner_only', 'public_edit')
    or p_metadata ->> 'status' not in ('ongoing', 'completed')
    or p_metadata ->> 'structureMode' not in ('day_based', 'freeform')
    or not (p_metadata ? 'relatedSeasonDayIds')
    or not (p_metadata ? 'relatedParticipantIds')
    or jsonb_typeof(p_metadata -> 'relatedSeasonDayIds') <> 'array'
    or jsonb_typeof(p_metadata -> 'relatedParticipantIds') <> 'array'
    or jsonb_array_length(p_metadata -> 'relatedSeasonDayIds') > 100
    or jsonb_array_length(p_metadata -> 'relatedParticipantIds') > 500
    or (
      p_metadata ->> 'visibility' = 'private'
      and p_metadata ->> 'editPolicy' <> 'owner_only'
    )
  then
    raise exception 'archive_invalid_metadata' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(p_metadata -> 'relatedSeasonDayIds') as value(id)
    where value.id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ) or exists (
    select 1
    from jsonb_array_elements_text(p_metadata -> 'relatedParticipantIds') as value(id)
    where value.id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ) or exists (
    select 1
    from jsonb_array_elements_text(p_metadata -> 'relatedSeasonDayIds') as value(id)
    group by value.id
    having count(*) > 1
  ) or exists (
    select 1
    from jsonb_array_elements_text(p_metadata -> 'relatedParticipantIds') as value(id)
    group by value.id
    having count(*) > 1
  ) then
    raise exception 'archive_invalid_metadata' using errcode = '22023';
  end if;

  if p_metadata ->> 'category' = 'character'
    and jsonb_array_length(p_metadata -> 'relatedParticipantIds') = 0
  then
    raise exception 'archive_character_participant_required' using errcode = '22023';
  end if;

  if p_metadata ->> 'category' = 'incident'
    and jsonb_array_length(p_metadata -> 'relatedSeasonDayIds') = 0
  then
    raise exception 'archive_incident_day_required' using errcode = '22023';
  end if;
end;
$$;

create function private.replace_archive_relations(
  p_archive_id uuid,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_season_id smallint;
  v_day_count integer;
  v_participant_count integer;
begin
  select archive.season_id
  into v_season_id
  from public.archives as archive
  where archive.id = p_archive_id;

  if not found then
    raise exception 'archive_not_found' using errcode = 'P0001';
  end if;

  select count(*)::integer
  into v_day_count
  from public.season_days as season_day
  join jsonb_array_elements_text(p_metadata -> 'relatedSeasonDayIds') as value(id)
    on season_day.id = value.id::uuid
  where season_day.season_id = v_season_id;

  if v_day_count <> jsonb_array_length(p_metadata -> 'relatedSeasonDayIds') then
    raise exception 'archive_relation_season_mismatch' using errcode = '22023';
  end if;

  select count(*)::integer
  into v_participant_count
  from public.season_participants as participant
  join jsonb_array_elements_text(p_metadata -> 'relatedParticipantIds') as value(id)
    on participant.id = value.id::uuid
  where participant.season_id = v_season_id;

  if v_participant_count <> jsonb_array_length(p_metadata -> 'relatedParticipantIds') then
    raise exception 'archive_relation_season_mismatch' using errcode = '22023';
  end if;

  delete from public.archive_day_relations where archive_id = p_archive_id;
  insert into public.archive_day_relations (archive_id, season_id, season_day_id)
  select p_archive_id, v_season_id, value.id::uuid
  from jsonb_array_elements_text(p_metadata -> 'relatedSeasonDayIds') as value(id);

  delete from public.archive_participant_relations where archive_id = p_archive_id;
  insert into public.archive_participant_relations (
    archive_id,
    season_id,
    season_participant_id
  )
  select p_archive_id, v_season_id, value.id::uuid
  from jsonb_array_elements_text(p_metadata -> 'relatedParticipantIds') as value(id);
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
    'metadata', jsonb_build_object(
      'title', archive.title,
      'description', archive.description,
      'category', archive.category,
      'status', archive.status,
      'relatedSeasonDayIds', coalesce((
        select jsonb_agg(relation.season_day_id order by season_day.day_number)
        from public.archive_day_relations as relation
        join public.season_days as season_day on season_day.id = relation.season_day_id
        where relation.archive_id = archive.id
      ), '[]'::jsonb),
      'relatedParticipantIds', coalesce((
        select jsonb_agg(relation.season_participant_id order by relation.season_participant_id)
        from public.archive_participant_relations as relation
        where relation.archive_id = archive.id
      ), '[]'::jsonb)
    ),
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

create or replace function public.create_archive(
  p_actor_user_id uuid,
  p_season_id smallint,
  p_metadata jsonb,
  p_content jsonb
)
returns table (archive_id uuid, current_revision integer, snapshot jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_archive_id uuid;
  v_snapshot jsonb;
begin
  perform private.assert_archive_metadata(p_metadata);

  if not exists (
    select 1 from public.users where id = p_actor_user_id and status = 'active'
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
    status,
    current_revision,
    archive_kind,
    structure_mode
  )
  values (
    p_actor_user_id,
    p_season_id,
    btrim(p_metadata ->> 'title'),
    nullif(btrim(p_metadata ->> 'description'), ''),
    p_metadata ->> 'category',
    p_metadata ->> 'visibility',
    p_metadata ->> 'editPolicy',
    p_metadata ->> 'status',
    1,
    'user',
    p_metadata ->> 'structureMode'
  )
  returning id into v_archive_id;

  perform private.replace_archive_relations(v_archive_id, p_metadata);
  perform private.replace_archive_content(v_archive_id, p_content);
  v_snapshot := private.build_archive_snapshot(v_archive_id);

  insert into public.archive_revisions (
    archive_id,
    revision_number,
    snapshot,
    created_by
  )
  values (v_archive_id, 1, v_snapshot, p_actor_user_id);

  return query select v_archive_id, 1, v_snapshot;
end;
$$;

create or replace function public.update_archive_metadata(
  p_actor_user_id uuid,
  p_archive_id uuid,
  p_base_revision integer,
  p_metadata jsonb
)
returns table (archive_id uuid, current_revision integer, snapshot jsonb)
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
  select * into v_archive from public.archives where id = p_archive_id for update;

  if not found then raise exception 'archive_not_found' using errcode = 'P0001'; end if;
  if v_archive.archive_kind <> 'user' then raise exception 'system_archive_read_only' using errcode = 'P0001'; end if;
  if v_archive.deleted_at is not null then raise exception 'archive_deleted' using errcode = 'P0001'; end if;
  if p_actor_user_id <> v_archive.owner_id then raise exception 'archive_metadata_forbidden' using errcode = 'P0001'; end if;
  if p_base_revision <> v_archive.current_revision then raise exception 'archive_revision_conflict' using errcode = 'P0001'; end if;
  if p_metadata ->> 'structureMode' <> v_archive.structure_mode then raise exception 'archive_immutable_field_changed' using errcode = 'P0001'; end if;

  update public.archives
  set title = btrim(p_metadata ->> 'title'),
      description = nullif(btrim(p_metadata ->> 'description'), ''),
      category = p_metadata ->> 'category',
      visibility = p_metadata ->> 'visibility',
      edit_policy = p_metadata ->> 'editPolicy',
      status = p_metadata ->> 'status',
      updated_at = now()
  where id = p_archive_id;

  perform private.replace_archive_relations(p_archive_id, p_metadata);
  v_snapshot := private.build_archive_snapshot(p_archive_id);
  v_next_revision := v_archive.current_revision + 1;
  update public.archives set current_revision = v_next_revision, updated_at = now() where id = p_archive_id;
  insert into public.archive_revisions (archive_id, revision_number, snapshot, created_by)
  values (p_archive_id, v_next_revision, v_snapshot, p_actor_user_id);

  return query select p_archive_id, v_next_revision, v_snapshot;
end;
$$;

create or replace function public.save_archive(
  p_actor_user_id uuid,
  p_archive_id uuid,
  p_base_revision integer,
  p_content jsonb,
  p_metadata jsonb default null
)
returns table (archive_id uuid, current_revision integer, snapshot jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_archive public.archives%rowtype;
  v_snapshot jsonb;
  v_next_revision integer;
begin
  if p_metadata is not null then perform private.assert_archive_metadata(p_metadata); end if;
  select * into v_archive from public.archives where id = p_archive_id for update;

  if not found then raise exception 'archive_not_found' using errcode = 'P0001'; end if;
  if v_archive.deleted_at is not null then raise exception 'archive_deleted' using errcode = 'P0001'; end if;
  if v_archive.archive_kind <> 'user' then raise exception 'system_archive_read_only' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.users where id = p_actor_user_id and status = 'active') then raise exception 'archive_user_not_active' using errcode = 'P0001'; end if;

  if p_actor_user_id <> v_archive.owner_id then
    if p_metadata is not null then raise exception 'archive_metadata_forbidden' using errcode = 'P0001'; end if;
    if not (v_archive.visibility = 'public' and v_archive.edit_policy = 'public_edit') then raise exception 'archive_content_forbidden' using errcode = 'P0001'; end if;
  end if;

  if p_base_revision <> v_archive.current_revision then raise exception 'archive_revision_conflict' using errcode = 'P0001'; end if;

  if p_metadata is not null then
    if p_metadata ->> 'structureMode' <> v_archive.structure_mode then raise exception 'archive_immutable_field_changed' using errcode = 'P0001'; end if;
    update public.archives
    set title = btrim(p_metadata ->> 'title'),
        description = nullif(btrim(p_metadata ->> 'description'), ''),
        category = p_metadata ->> 'category',
        visibility = p_metadata ->> 'visibility',
        edit_policy = p_metadata ->> 'editPolicy',
        status = p_metadata ->> 'status',
        updated_at = now()
    where id = p_archive_id;
    perform private.replace_archive_relations(p_archive_id, p_metadata);
  end if;

  perform private.replace_archive_content(p_archive_id, p_content);
  v_snapshot := private.build_archive_snapshot(p_archive_id);
  v_next_revision := v_archive.current_revision + 1;
  update public.archives set current_revision = v_next_revision, updated_at = now() where id = p_archive_id;
  insert into public.archive_revisions (archive_id, revision_number, snapshot, created_by)
  values (p_archive_id, v_next_revision, v_snapshot, p_actor_user_id);
  return query select p_archive_id, v_next_revision, v_snapshot;
end;
$$;

create or replace function public.restore_archive_revision(
  p_actor_user_id uuid,
  p_archive_id uuid,
  p_base_revision integer,
  p_revision_number integer
)
returns table (archive_id uuid, current_revision integer, snapshot jsonb)
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
  select * into v_archive from public.archives where id = p_archive_id for update;
  if not found then raise exception 'archive_not_found' using errcode = 'P0001'; end if;
  if v_archive.archive_kind <> 'user' then raise exception 'system_archive_read_only' using errcode = 'P0001'; end if;
  if v_archive.deleted_at is not null then raise exception 'archive_deleted' using errcode = 'P0001'; end if;
  if p_actor_user_id <> v_archive.owner_id then raise exception 'archive_metadata_forbidden' using errcode = 'P0001'; end if;
  if p_base_revision <> v_archive.current_revision then raise exception 'archive_revision_conflict' using errcode = 'P0001'; end if;

  select revision.snapshot into v_revision_snapshot
  from public.archive_revisions as revision
  where revision.archive_id = p_archive_id
    and revision.revision_number = p_revision_number;
  if not found then raise exception 'archive_revision_not_found' using errcode = 'P0001'; end if;

  update public.archives
  set title = v_revision_snapshot #>> '{metadata,title}',
      description = nullif(v_revision_snapshot #>> '{metadata,description}', ''),
      category = v_revision_snapshot #>> '{metadata,category}',
      status = v_revision_snapshot #>> '{metadata,status}',
      updated_at = now()
  where id = p_archive_id;

  if (v_revision_snapshot -> 'metadata') ? 'relatedSeasonDayIds'
    and (v_revision_snapshot -> 'metadata') ? 'relatedParticipantIds'
  then
    perform private.replace_archive_relations(p_archive_id, jsonb_build_object(
      'relatedSeasonDayIds', v_revision_snapshot #> '{metadata,relatedSeasonDayIds}',
      'relatedParticipantIds', v_revision_snapshot #> '{metadata,relatedParticipantIds}'
    ));
  end if;

  perform private.replace_archive_content(
    p_archive_id,
    jsonb_build_object('chapters', v_revision_snapshot -> 'chapters')
  );
  v_snapshot := private.build_archive_snapshot(p_archive_id);
  v_next_revision := v_archive.current_revision + 1;
  update public.archives set current_revision = v_next_revision, updated_at = now() where id = p_archive_id;
  insert into public.archive_revisions (archive_id, revision_number, snapshot, created_by)
  values (p_archive_id, v_next_revision, v_snapshot, p_actor_user_id);
  return query select p_archive_id, v_next_revision, v_snapshot;
end;
$$;

create or replace function private.create_system_character_archive(
  p_season_id smallint,
  p_participant_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_archive_id uuid;
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

  select archive.id into v_archive_id
  from public.archives as archive
  where archive.season_id = p_season_id
    and archive.system_participant_id = p_participant_id
    and archive.archive_kind = 'system_character';

  insert into public.archive_participant_relations (
    archive_id,
    season_id,
    season_participant_id
  )
  values (v_archive_id, p_season_id, p_participant_id)
  on conflict (archive_id, season_participant_id) do nothing;
end;
$$;

revoke execute on function private.replace_archive_relations(uuid, jsonb)
from public, anon, authenticated, service_role;

revoke execute on function private.assert_archive_metadata(jsonb)
from public, anon, authenticated, service_role;

revoke execute on function private.build_archive_snapshot(uuid)
from public, anon, authenticated, service_role;

revoke execute on function private.create_system_character_archive(smallint, uuid)
from public, anon, authenticated, service_role;

revoke execute on function public.create_archive(uuid, smallint, jsonb, jsonb)
from public, anon, authenticated;

revoke execute on function public.update_archive_metadata(uuid, uuid, integer, jsonb)
from public, anon, authenticated;

revoke execute on function public.save_archive(uuid, uuid, integer, jsonb, jsonb)
from public, anon, authenticated;

revoke execute on function public.restore_archive_revision(uuid, uuid, integer, integer)
from public, anon, authenticated;

grant execute on function public.create_archive(uuid, smallint, jsonb, jsonb)
to service_role;

grant execute on function public.update_archive_metadata(uuid, uuid, integer, jsonb)
to service_role;

grant execute on function public.save_archive(uuid, uuid, integer, jsonb, jsonb)
to service_role;

grant execute on function public.restore_archive_revision(uuid, uuid, integer, integer)
to service_role;

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
    left join public.users as owner on owner.id = archive.owner_id
    left join public.season_participants as participant
      on participant.id = archive.system_participant_id
      and participant.season_id = archive.season_id
    left join public.streamers as streamer on streamer.id = participant.streamer_id
    where archive.visibility = 'public'
      and archive.deleted_at is null
      and (
        p_type = 'all'
        or (p_type = 'system' and archive.archive_kind = 'system_character')
        or (p_type = 'user' and archive.archive_kind = 'user')
      )
      and (p_type <> 'user' or p_category is null or archive.category = p_category)
      and (p_type <> 'user' or p_status is null or archive.status = p_status)
      and (
        p_participant_id is null
        or exists (
          select 1
          from public.archive_participant_relations as relation
          where relation.archive_id = archive.id
            and relation.season_participant_id = p_participant_id
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
    join public.archive_items as item on item.archive_id = archive.id
    join public.archive_chapters as chapter
      on chapter.id = item.chapter_id
      and chapter.archive_id = archive.id
    join public.clips as clip on clip.id = item.clip_id
    left join public.season_days as season_day on season_day.id = chapter.season_day_id
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
        array_agg(clip.thumbnail_url order by clip.clip_created_at desc, clip.id desc)
        filter (where clip.thumbnail_url is not null)
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
    left join user_stats on user_stats.archive_id = archive.id
    left join system_stats on system_stats.archive_id = archive.id
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
