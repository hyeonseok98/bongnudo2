begin;

do $$
declare
  v_deleted_archive_id uuid;
  v_editor_id uuid;
  v_expired_archive_id uuid;
  v_owner_id uuid;
  v_public_archive_id uuid;
  v_season_id smallint;
begin
  insert into public.users (chzzk_channel_id, chzzk_channel_name)
  values (
    'my-archive-owner-' || gen_random_uuid(),
    'my-archive-owner'
  )
  returning id into v_owner_id;

  insert into public.users (chzzk_channel_id, chzzk_channel_name)
  values (
    'my-archive-editor-' || gen_random_uuid(),
    'my-archive-editor'
  )
  returning id into v_editor_id;

  select id
  into v_season_id
  from public.seasons
  where is_active = true
  limit 1;

  if v_season_id is null then
    raise exception 'my_archive_verification_season_missing';
  end if;

  select archive_id
  into v_public_archive_id
  from public.create_archive(
    v_owner_id,
    v_season_id,
    '{"title":"my-archive-verification-public","description":null,"category":"other","visibility":"public","editPolicy":"public_edit","status":"ongoing","structureMode":"freeform"}'::jsonb,
    '{"chapters":[]}'::jsonb
  );

  perform public.save_archive_content(
    v_editor_id,
    v_public_archive_id,
    1,
    '{"chapters":[]}'::jsonb
  );

  if not exists (
    select 1
    from public.get_my_archive_page(v_editor_id, 'edited')
    where archive_id = v_public_archive_id
      and last_edited_by_me_at is not null
  ) then
    raise exception 'my_archive_verification_editor_archive_missing';
  end if;

  if exists (
    select 1
    from public.get_my_archive_page(v_owner_id, 'edited')
    where archive_id = v_public_archive_id
  ) then
    raise exception 'my_archive_verification_owner_archive_in_edited';
  end if;

  select archive_id
  into v_deleted_archive_id
  from public.create_archive(
    v_owner_id,
    v_season_id,
    '{"title":"my-archive-verification-deleted","description":null,"category":"other","visibility":"private","editPolicy":"owner_only","status":"ongoing","structureMode":"freeform"}'::jsonb,
    '{"chapters":[]}'::jsonb
  );

  perform public.soft_delete_archive(v_owner_id, v_deleted_archive_id);

  if exists (
    select 1
    from public.get_my_archive_page(v_owner_id, 'owned')
    where archive_id = v_deleted_archive_id
  ) or not exists (
    select 1
    from public.get_my_archive_page(v_owner_id, 'deleted')
    where archive_id = v_deleted_archive_id
      and can_restore
  ) then
    raise exception 'my_archive_verification_soft_delete_page_failed';
  end if;

  select archive_id
  into v_expired_archive_id
  from public.create_archive(
    v_owner_id,
    v_season_id,
    '{"title":"my-archive-verification-expired","description":null,"category":"other","visibility":"private","editPolicy":"owner_only","status":"ongoing","structureMode":"freeform"}'::jsonb,
    '{"chapters":[]}'::jsonb
  );

  update public.archives
  set deleted_at = now() - interval '31 days'
  where id = v_expired_archive_id;

  if exists (
    select 1
    from public.get_my_archive_page(v_owner_id, 'deleted')
    where archive_id = v_expired_archive_id
  ) then
    raise exception 'my_archive_verification_expired_archive_visible';
  end if;

  begin
    perform public.restore_archive(v_owner_id, v_expired_archive_id);
    raise exception 'my_archive_verification_expired_restore_allowed';
  exception
    when others then
      if sqlerrm <> 'archive_restore_window_expired' then
        raise;
      end if;
  end;
end;
$$;

rollback;
