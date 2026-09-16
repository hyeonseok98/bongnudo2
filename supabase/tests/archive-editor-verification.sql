begin;

create temporary table archive_editor_verification_context (
  archive_id uuid not null,
  editor_id uuid not null,
  matching_day_id uuid not null,
  mismatched_day_id uuid not null,
  owner_id uuid not null,
  public_archive_id uuid not null,
  revision_after_owner_save integer not null
) on commit drop;

do $$
declare
  v_archive_id uuid;
  v_editor_id uuid;
  v_first_day_id uuid;
  v_second_day_id uuid;
  v_owner_id uuid;
  v_participant_id uuid;
  v_public_archive_id uuid;
  v_revision integer;
  v_season_id smallint;
  v_streamer_id uuid;
  v_clip_id uuid;
begin
  select id
  into v_season_id
  from public.seasons
  where is_active = true
  limit 1;

  select id
  into v_streamer_id
  from public.streamers
  limit 1;

  select id
  into v_participant_id
  from public.season_participants
  where season_id = v_season_id
  limit 1;

  select id
  into v_first_day_id
  from public.season_days
  where season_id = v_season_id
  order by day_number
  limit 1;

  select id
  into v_second_day_id
  from public.season_days
  where season_id = v_season_id
  order by day_number
  offset 1
  limit 1;

  if v_season_id is null
    or v_streamer_id is null
    or v_participant_id is null
    or v_first_day_id is null
    or v_second_day_id is null
  then
    raise exception 'archive_editor_verification_fixture_missing';
  end if;

  insert into public.users (chzzk_channel_id, chzzk_channel_name)
  values ('archive-editor-owner-' || gen_random_uuid(), 'archive-editor-owner')
  returning id into v_owner_id;

  insert into public.users (chzzk_channel_id, chzzk_channel_name)
  values ('archive-editor-' || gen_random_uuid(), 'archive-editor')
  returning id into v_editor_id;

  insert into public.clips (
    provider_clip_id,
    streamer_id,
    season_id,
    season_participant_id,
    season_day_id,
    title,
    clip_url,
    clip_created_at,
    collected_at
  )
  values (
    'archive-editor-' || replace(gen_random_uuid()::text, '-', ''),
    v_streamer_id,
    v_season_id,
    v_participant_id,
    v_first_day_id,
    'archive editor verification clip',
    'https://chzzk.naver.com/clips/archiveeditor',
    now(),
    now()
  )
  returning id into v_clip_id;

  select archive_id
  into v_archive_id
  from public.create_archive(
    v_owner_id,
    v_season_id,
    '{"title":"archive-editor-day","description":null,"category":"other","visibility":"private","editPolicy":"owner_only","status":"ongoing","structureMode":"day_based"}'::jsonb,
    jsonb_build_object('chapters', jsonb_build_array(jsonb_build_object(
      'title', '1일차',
      'description', null,
      'seasonDayId', v_first_day_id,
      'items', '[]'::jsonb
    )))
  );

  select current_revision
  into v_revision
  from public.save_archive(
    v_owner_id,
    v_archive_id,
    1,
    jsonb_build_object('chapters', jsonb_build_array(jsonb_build_object(
      'title', '1일차',
      'description', null,
      'seasonDayId', v_first_day_id,
      'items', jsonb_build_array(jsonb_build_object('clipId', v_clip_id, 'note', null))
    ))),
    '{"title":"archive-editor-day","description":null,"category":"other","visibility":"private","editPolicy":"owner_only","status":"ongoing","structureMode":"day_based"}'::jsonb
  );

  if v_revision <> 2 then
    raise exception 'archive_editor_unified_save_revision_failed';
  end if;

  begin
    perform public.save_archive(
      v_owner_id,
      v_archive_id,
      v_revision,
      jsonb_build_object('chapters', jsonb_build_array(jsonb_build_object(
        'title', '2일차',
        'description', null,
        'seasonDayId', v_second_day_id,
        'items', jsonb_build_array(jsonb_build_object('clipId', v_clip_id, 'note', null))
      ))),
      null
    );
    raise exception 'archive_editor_day_mismatch_allowed';
  exception
    when others then
      if sqlerrm <> 'archive_day_based_clip_mismatch' then
        raise;
      end if;
  end;

  if (select current_revision from public.archives where id = v_archive_id) <> v_revision then
    raise exception 'archive_editor_day_mismatch_changed_data';
  end if;

  select archive_id
  into v_public_archive_id
  from public.create_archive(
    v_owner_id,
    v_season_id,
    '{"title":"archive-editor-public","description":null,"category":"other","visibility":"public","editPolicy":"public_edit","status":"ongoing","structureMode":"freeform"}'::jsonb,
    '{"chapters":[]}'::jsonb
  );

  perform public.save_archive(v_editor_id, v_public_archive_id, 1, '{"chapters":[]}'::jsonb, null);

  begin
    perform public.save_archive(
      v_editor_id,
      v_public_archive_id,
      2,
      '{"chapters":[]}'::jsonb,
      '{"title":"mutated","description":null,"category":"other","visibility":"public","editPolicy":"public_edit","status":"ongoing","structureMode":"freeform"}'::jsonb
    );
    raise exception 'archive_editor_metadata_mutation_allowed';
  exception
    when others then
      if sqlerrm <> 'archive_metadata_forbidden' then
        raise;
      end if;
  end;

  insert into archive_editor_verification_context
  values (
    v_archive_id,
    v_editor_id,
    v_first_day_id,
    v_second_day_id,
    v_owner_id,
    v_public_archive_id,
    v_revision
  );
end;
$$;

rollback;
