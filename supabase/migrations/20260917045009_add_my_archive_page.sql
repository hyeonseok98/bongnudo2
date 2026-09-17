create function public.get_my_archive_page(
  p_actor_user_id uuid,
  p_tab text,
  p_cursor_at timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 21
)
returns table (
  archive_id uuid,
  title text,
  visibility text,
  edit_policy text,
  status text,
  structure_mode text,
  clip_count bigint,
  updated_at timestamptz,
  current_revision integer,
  owner_name text,
  last_edited_by_me_at timestamptz,
  deleted_at timestamptz,
  restore_expires_at timestamptz,
  can_restore boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 21), 1), 21);
begin
  if p_tab not in ('owned', 'edited', 'deleted') then
    raise exception 'archive_invalid_management_tab' using errcode = '22023';
  end if;

  if (p_cursor_at is null) <> (p_cursor_id is null) then
    raise exception 'archive_invalid_management_cursor' using errcode = '22023';
  end if;

  if p_tab = 'owned' then
    return query
    with page as (
      select
        archive.id,
        archive.title,
        archive.visibility,
        archive.edit_policy,
        archive.status,
        archive.structure_mode,
        archive.updated_at,
        archive.current_revision
      from public.archives as archive
      where archive.archive_kind = 'user'
        and archive.owner_id = p_actor_user_id
        and archive.deleted_at is null
        and (
          p_cursor_at is null
          or (archive.updated_at, archive.id) < (p_cursor_at, p_cursor_id)
        )
      order by archive.updated_at desc, archive.id desc
      limit v_limit
    )
    select
      page.id,
      page.title,
      page.visibility,
      page.edit_policy,
      page.status,
      page.structure_mode,
      count(item.id),
      page.updated_at,
      page.current_revision,
      null::text,
      null::timestamptz,
      null::timestamptz,
      null::timestamptz,
      false
    from page
    left join public.archive_items as item
      on item.archive_id = page.id
    group by
      page.id,
      page.title,
      page.visibility,
      page.edit_policy,
      page.status,
      page.structure_mode,
      page.updated_at,
      page.current_revision
    order by page.updated_at desc, page.id desc;
    return;
  end if;

  if p_tab = 'edited' then
    return query
    with edited_archives as (
      select
        archive.id,
        archive.title,
        archive.visibility,
        archive.edit_policy,
        archive.status,
        archive.structure_mode,
        archive.updated_at,
        archive.current_revision,
        owner.chzzk_channel_name as owner_name,
        max(revision.created_at) as last_edited_by_me_at
      from public.archives as archive
      inner join public.archive_revisions as revision
        on revision.archive_id = archive.id
        and revision.created_by = p_actor_user_id
      inner join public.users as owner
        on owner.id = archive.owner_id
      where archive.archive_kind = 'user'
        and archive.owner_id <> p_actor_user_id
        and archive.deleted_at is null
      group by
        archive.id,
        archive.title,
        archive.visibility,
        archive.edit_policy,
        archive.status,
        archive.structure_mode,
        archive.updated_at,
        archive.current_revision,
        owner.chzzk_channel_name
    ),
    page as (
      select *
      from edited_archives
      where (
        p_cursor_at is null
        or (last_edited_by_me_at, id) < (p_cursor_at, p_cursor_id)
      )
      order by last_edited_by_me_at desc, id desc
      limit v_limit
    )
    select
      page.id,
      page.title,
      page.visibility,
      page.edit_policy,
      page.status,
      page.structure_mode,
      count(item.id),
      page.updated_at,
      page.current_revision,
      page.owner_name,
      page.last_edited_by_me_at,
      null::timestamptz,
      null::timestamptz,
      false
    from page
    left join public.archive_items as item
      on item.archive_id = page.id
    group by
      page.id,
      page.title,
      page.visibility,
      page.edit_policy,
      page.status,
      page.structure_mode,
      page.updated_at,
      page.current_revision,
      page.owner_name,
      page.last_edited_by_me_at
    order by page.last_edited_by_me_at desc, page.id desc;
    return;
  end if;

  return query
  with page as (
    select
      archive.id,
      archive.title,
      archive.visibility,
      archive.edit_policy,
      archive.status,
      archive.structure_mode,
      archive.updated_at,
      archive.current_revision,
      archive.deleted_at
    from public.archives as archive
    where archive.archive_kind = 'user'
      and archive.owner_id = p_actor_user_id
      and archive.deleted_at is not null
      and archive.deleted_at >= now() - interval '30 days'
      and (
        p_cursor_at is null
        or (archive.deleted_at, archive.id) < (p_cursor_at, p_cursor_id)
      )
    order by archive.deleted_at desc, archive.id desc
    limit v_limit
  )
  select
    page.id,
    page.title,
    page.visibility,
    page.edit_policy,
    page.status,
    page.structure_mode,
    count(item.id),
    page.updated_at,
    page.current_revision,
    null::text,
    null::timestamptz,
    page.deleted_at,
    page.deleted_at + interval '30 days',
    page.deleted_at >= now() - interval '30 days'
  from page
  left join public.archive_items as item
    on item.archive_id = page.id
  group by
    page.id,
    page.title,
    page.visibility,
    page.edit_policy,
    page.status,
    page.structure_mode,
    page.updated_at,
    page.current_revision,
    page.deleted_at
  order by page.deleted_at desc, page.id desc;
end;
$$;

revoke execute on function public.get_my_archive_page(uuid, text, timestamptz, uuid, integer)
from public, anon, authenticated;

grant execute on function public.get_my_archive_page(uuid, text, timestamptz, uuid, integer)
to service_role;
