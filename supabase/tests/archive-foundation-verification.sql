begin;

create temporary table archive_verification_context (
  owner_id uuid not null,
  editor_id uuid not null,
  season_id smallint not null,
  private_archive_id uuid not null,
  public_archive_id uuid not null,
  public_revision integer not null
) on commit drop;

do $$
declare
  v_owner_id uuid;
  v_editor_id uuid;
  v_season_id smallint;
  v_private_archive_id uuid;
  v_public_archive_id uuid;
  v_private_revision integer;
  v_public_revision integer;
begin
  insert into public.users (chzzk_channel_id, chzzk_channel_name)
  values (
    'archive-verification-owner-' || gen_random_uuid(),
    'archive-verification-owner'
  )
  returning id into v_owner_id;

  insert into public.users (chzzk_channel_id, chzzk_channel_name)
  values (
    'archive-verification-editor-' || gen_random_uuid(),
    'archive-verification-editor'
  )
  returning id into v_editor_id;

  select id
  into v_season_id
  from public.seasons
  order by id
  limit 1;

  if v_season_id is null then
    raise exception 'archive_verification_season_missing';
  end if;

  select archive_id, current_revision
  into v_private_archive_id, v_private_revision
  from public.create_archive(
    v_owner_id,
    v_season_id,
    '{"title":"archive-verification-private","description":null,"category":"other","visibility":"private","editPolicy":"owner_only","status":"ongoing","structureMode":"freeform"}'::jsonb,
    '{"chapters":[]}'::jsonb
  );

  select archive_id, current_revision
  into v_public_archive_id, v_public_revision
  from public.create_archive(
    v_owner_id,
    v_season_id,
    '{"title":"archive-verification-public","description":null,"category":"other","visibility":"public","editPolicy":"public_edit","status":"ongoing","structureMode":"freeform"}'::jsonb,
    '{"chapters":[]}'::jsonb
  );

  if v_private_revision <> 1 or v_public_revision <> 1 then
    raise exception 'archive_verification_initial_revision_failed';
  end if;

  insert into archive_verification_context
  values (
    v_owner_id,
    v_editor_id,
    v_season_id,
    v_private_archive_id,
    v_public_archive_id,
    v_public_revision
  );
end;
$$;

grant select on archive_verification_context to anon;

do $$
declare
  v_private_archive_id uuid;
begin
  select private_archive_id
  into v_private_archive_id
  from archive_verification_context;

  if not exists (
    select 1
    from public.archives
    where id = v_private_archive_id
  ) then
    raise exception 'archive_verification_owner_read_failed';
  end if;
end;
$$;

set local role anon;

do $$
declare
  v_private_archive_id uuid;
  v_public_archive_id uuid;
begin
  select private_archive_id, public_archive_id
  into v_private_archive_id, v_public_archive_id
  from archive_verification_context;

  if exists (
    select 1
    from public.archives
    where id = v_private_archive_id
  ) then
    raise exception 'archive_verification_private_visible_to_anon';
  end if;

  if not exists (
    select 1
    from public.archives
    where id = v_public_archive_id
  ) then
    raise exception 'archive_verification_public_hidden_from_anon';
  end if;
end;
$$;

reset role;

do $$
declare
  v_owner_id uuid;
  v_editor_id uuid;
  v_public_archive_id uuid;
  v_public_revision integer;
  v_next_revision integer;
begin
  select owner_id, editor_id, public_archive_id, public_revision
  into v_owner_id, v_editor_id, v_public_archive_id, v_public_revision
  from archive_verification_context;

  begin
    perform public.update_archive_metadata(
      v_owner_id,
      v_public_archive_id,
      v_public_revision,
      '{"title":"archive-verification-public","description":null,"category":"other","visibility":"private","editPolicy":"owner_only","status":"ongoing","structureMode":"freeform"}'::jsonb
    );
    raise exception 'archive_verification_public_to_private_allowed';
  exception
    when others then
      if sqlerrm <> 'archive_cannot_be_private_after_publication' then
        raise;
      end if;
  end;

  select current_revision
  into v_next_revision
  from public.save_archive_content(
    v_editor_id,
    v_public_archive_id,
    v_public_revision,
    '{"chapters":[]}'::jsonb
  );

  if v_next_revision <> v_public_revision + 1 then
    raise exception 'archive_verification_public_edit_content_failed';
  end if;

  begin
    perform public.update_archive_metadata(
      v_editor_id,
      v_public_archive_id,
      v_next_revision,
      '{"title":"archive-verification-mutated","description":null,"category":"other","visibility":"public","editPolicy":"public_edit","status":"ongoing","structureMode":"freeform"}'::jsonb
    );
    raise exception 'archive_verification_public_editor_metadata_allowed';
  exception
    when others then
      if sqlerrm <> 'archive_metadata_forbidden' then
        raise;
      end if;
  end;

  begin
    perform public.save_archive_content(
      v_editor_id,
      v_public_archive_id,
      v_public_revision,
      '{"chapters":[]}'::jsonb
    );
    raise exception 'archive_verification_stale_revision_allowed';
  exception
    when others then
      if sqlerrm <> 'archive_revision_conflict' then
        raise;
      end if;
  end;

  if not exists (
    select 1
    from public.archives
    where id = v_public_archive_id
      and current_revision = v_next_revision
      and title = 'archive-verification-public'
  ) then
    raise exception 'archive_verification_conflict_changed_data';
  end if;
end;
$$;

rollback;
