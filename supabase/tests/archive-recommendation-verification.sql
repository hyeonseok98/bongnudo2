begin;

do $$
declare
  v_anonymous_hash text := repeat('a', 64);
  v_archive_id uuid;
  v_count integer;
  v_deleted_archive_id uuid;
  v_owner_id uuid;
  v_private_archive_id uuid;
  v_recommended boolean;
  v_season_id smallint;
begin
  select id into v_owner_id from public.users where status = 'active' limit 1;
  select id into v_season_id from public.seasons where is_active = true limit 1;
  select id into v_archive_id
  from public.archives
  where visibility = 'public'
    and deleted_at is null
  limit 1;

  if v_owner_id is null or v_season_id is null or v_archive_id is null then
    raise exception 'archive_recommendation_verification_fixture_missing';
  end if;

  delete from public.archive_recommendations
  where archive_id = v_archive_id
    and (user_id = v_owner_id or anonymous_voter_hash = v_anonymous_hash);

  update public.archives
  set recommendation_count = (
    select count(*)::integer
    from public.archive_recommendations
    where archive_id = v_archive_id
  )
  where id = v_archive_id;

  select recommended, recommendation_count
  into v_recommended, v_count
  from public.toggle_archive_recommendation(v_archive_id, null, v_anonymous_hash);

  if not v_recommended
    or (select count(*) from public.archive_recommendations where archive_id = v_archive_id and anonymous_voter_hash = v_anonymous_hash) <> 1
    or v_count <> (select count(*) from public.archive_recommendations where archive_id = v_archive_id)
  then
    raise exception 'archive_anonymous_recommendation_add_failed';
  end if;

  select recommended, recommendation_count
  into v_recommended, v_count
  from public.toggle_archive_recommendation(v_archive_id, null, v_anonymous_hash);

  if v_recommended
    or exists (select 1 from public.archive_recommendations where archive_id = v_archive_id and anonymous_voter_hash = v_anonymous_hash)
    or v_count <> (select count(*) from public.archive_recommendations where archive_id = v_archive_id)
  then
    raise exception 'archive_anonymous_recommendation_cancel_failed';
  end if;

  perform public.toggle_archive_recommendation(v_archive_id, v_owner_id, null);

  if (select count(*) from public.archive_recommendations where archive_id = v_archive_id and user_id = v_owner_id) <> 1 then
    raise exception 'archive_user_recommendation_add_failed';
  end if;

  perform public.toggle_archive_recommendation(v_archive_id, v_owner_id, null);

  perform public.toggle_archive_recommendation(v_archive_id, null, v_anonymous_hash);

  select recommended, recommendation_count
  into v_recommended, v_count
  from public.toggle_archive_recommendation(v_archive_id, v_owner_id, v_anonymous_hash);

  if v_recommended
    or exists (
      select 1
      from public.archive_recommendations
      where archive_id = v_archive_id
        and (user_id = v_owner_id or anonymous_voter_hash = v_anonymous_hash)
    )
  then
    raise exception 'archive_anonymous_login_merge_failed';
  end if;

  insert into public.archives (
    archive_kind,
    category,
    current_revision,
    deleted_at,
    edit_policy,
    owner_id,
    season_id,
    structure_mode,
    title,
    visibility
  ) values (
    'user',
    'other',
    1,
    null,
    'owner_only',
    v_owner_id,
    v_season_id,
    'freeform',
    'recommendation private verification',
    'private'
  ) returning id into v_private_archive_id;

  begin
    perform public.toggle_archive_recommendation(v_private_archive_id, null, v_anonymous_hash);
    raise exception 'archive_private_recommendation_allowed';
  exception
    when sqlstate 'P0001' then
      if sqlerrm <> 'archive_recommendation_forbidden' then
        raise;
      end if;
  end;

  insert into public.archives (
    archive_kind,
    category,
    current_revision,
    deleted_at,
    edit_policy,
    owner_id,
    season_id,
    structure_mode,
    title,
    visibility
  ) values (
    'user',
    'other',
    1,
    now(),
    'owner_only',
    v_owner_id,
    v_season_id,
    'freeform',
    'recommendation deleted verification',
    'private'
  ) returning id into v_deleted_archive_id;

  begin
    perform public.toggle_archive_recommendation(v_deleted_archive_id, v_owner_id, null);
    raise exception 'archive_deleted_recommendation_allowed';
  exception
    when sqlstate 'P0001' then
      if sqlerrm <> 'archive_recommendation_forbidden' then
        raise;
      end if;
  end;
end;
$$;

rollback;
