create function public.create_report(
  p_report_id uuid,
  p_timeline_event_id uuid,
  p_reporter_user_id uuid,
  p_season_id smallint,
  p_report_type text,
  p_category_id uuid,
  p_title text,
  p_content text,
  p_occurred_at timestamptz,
  p_participant_ids uuid[],
  p_tag_ids uuid[],
  p_images jsonb,
  p_clip_urls text[]
)
returns table (
  created_report_id uuid,
  created_timeline_event_id uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_report_type not in ('timeline', 'bug', 'idea', 'correction') then
    raise exception 'unsupported report type' using errcode = '22023';
  end if;

  if p_report_type = 'timeline' then
    insert into public.timeline_events (
      id,
      season_id,
      category_id,
      title,
      content,
      occurred_at,
      publication_status
    )
    values (
      p_timeline_event_id,
      p_season_id,
      p_category_id,
      p_title,
      p_content,
      p_occurred_at,
      'published'
    );
  end if;

  insert into public.reports (
    id,
    reporter_user_id,
    season_id,
    report_type,
    category_id,
    timeline_event_id,
    title,
    content,
    occurred_at
  )
  values (
    p_report_id,
    p_reporter_user_id,
    p_season_id,
    p_report_type,
    p_category_id,
    p_timeline_event_id,
    p_title,
    p_content,
    p_occurred_at
  );

  if p_report_type = 'timeline' then
    insert into public.report_participants (
      report_id,
      season_id,
      season_participant_id,
      sort_order,
      is_primary
    )
    select
      p_report_id,
      p_season_id,
      participant_id,
      participant_order::smallint,
      participant_order = 1
    from unnest(coalesce(p_participant_ids, array[]::uuid[]))
      with ordinality as participant(participant_id, participant_order);

    insert into public.timeline_event_participants (
      timeline_event_id,
      season_id,
      season_participant_id,
      sort_order,
      is_primary
    )
    select
      p_timeline_event_id,
      p_season_id,
      participant_id,
      participant_order::smallint,
      participant_order = 1
    from unnest(coalesce(p_participant_ids, array[]::uuid[]))
      with ordinality as participant(participant_id, participant_order);

    insert into public.report_tags (report_id, tag_id, sort_order)
    select p_report_id, tag_id, tag_order::smallint
    from unnest(coalesce(p_tag_ids, array[]::uuid[]))
      with ordinality as tag(tag_id, tag_order);

    insert into public.timeline_event_tags (
      timeline_event_id,
      tag_id,
      sort_order
    )
    select p_timeline_event_id, tag_id, tag_order::smallint
    from unnest(coalesce(p_tag_ids, array[]::uuid[]))
      with ordinality as tag(tag_id, tag_order);
  end if;

  insert into public.report_media (
    report_id,
    media_type,
    object_key,
    mime_type,
    byte_size,
    sort_order
  )
  select
    p_report_id,
    'image',
    image.value ->> 'objectKey',
    image.value ->> 'mimeType',
    (image.value ->> 'byteSize')::bigint,
    image.ordinality::smallint
  from jsonb_array_elements(coalesce(p_images, '[]'::jsonb))
    with ordinality as image(value, ordinality);

  if p_report_type = 'timeline' then
    insert into public.timeline_event_media (
      timeline_event_id,
      media_type,
      object_key,
      mime_type,
      byte_size,
      sort_order
    )
    select
      p_timeline_event_id,
      'image',
      image.value ->> 'objectKey',
      image.value ->> 'mimeType',
      (image.value ->> 'byteSize')::bigint,
      image.ordinality::smallint
    from jsonb_array_elements(coalesce(p_images, '[]'::jsonb))
      with ordinality as image(value, ordinality);

    insert into public.report_media (
      report_id,
      media_type,
      clip_url,
      sort_order
    )
    select
      p_report_id,
      'chzzk_clip',
      clip_url,
      (jsonb_array_length(coalesce(p_images, '[]'::jsonb)) + clip_order)::smallint
    from unnest(coalesce(p_clip_urls, array[]::text[]))
      with ordinality as clip(clip_url, clip_order);

    insert into public.timeline_event_media (
      timeline_event_id,
      media_type,
      clip_url,
      sort_order
    )
    select
      p_timeline_event_id,
      'chzzk_clip',
      clip_url,
      (jsonb_array_length(coalesce(p_images, '[]'::jsonb)) + clip_order)::smallint
    from unnest(coalesce(p_clip_urls, array[]::text[]))
      with ordinality as clip(clip_url, clip_order);
  end if;

  return query
  select
    p_report_id,
    case when p_report_type in ('timeline', 'correction')
      then p_timeline_event_id
      else null
    end;
end;
$$;

revoke execute on function public.create_report(
  uuid,
  uuid,
  uuid,
  smallint,
  text,
  uuid,
  text,
  text,
  timestamptz,
  uuid[],
  uuid[],
  jsonb,
  text[]
) from public, anon, authenticated;

grant execute on function public.create_report(
  uuid,
  uuid,
  uuid,
  smallint,
  text,
  uuid,
  text,
  text,
  timestamptz,
  uuid[],
  uuid[],
  jsonb,
  text[]
) to service_role;

create function public.search_report_participants(
  p_query text,
  p_limit integer default 20
)
returns table (
  season_participant_id uuid,
  rp_name text,
  streamer_name text,
  organization_name text,
  role text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with search_input as (
    select replace(
      replace(
        replace(trim(p_query), '\', '\\'),
        '%', '\%'
      ),
      '_', '\_'
    ) as escaped_query
  )
  select
    participant.id,
    participant.rp_name,
    streamer.name,
    current_affiliation.organization_name,
    current_affiliation.role
  from public.season_participants as participant
  join public.seasons as season
    on season.id = participant.season_id
    and season.is_active = true
  join public.streamers as streamer
    on streamer.id = participant.streamer_id
  left join lateral (
    select
      organization.name as organization_name,
      role_history.role
    from public.organization_memberships as membership
    join public.organizations as organization
      on organization.id = membership.organization_id
    left join lateral (
      select history.role
      from public.organization_role_histories as history
      where history.membership_id = membership.id
        and history.end_date is null
      order by history.start_date desc nulls last, history.created_at desc
      limit 1
    ) as role_history on true
    where membership.participant_id = participant.id
      and membership.left_at is null
    order by
      membership.is_primary desc,
      membership.display_order,
      organization.name
    limit 1
  ) as current_affiliation on true
  cross join search_input
  where char_length(search_input.escaped_query) between 1 and 100
    and (
      participant.rp_name ilike '%' || search_input.escaped_query || '%' escape '\'
      or streamer.name ilike '%' || search_input.escaped_query || '%' escape '\'
    )
  order by
    case
      when participant.rp_name = trim(p_query) then 0
      when streamer.name = trim(p_query) then 1
      else 2
    end,
    participant.rp_name nulls last,
    streamer.name,
    participant.id
  limit least(greatest(p_limit, 1), 20);
$$;

revoke execute on function public.search_report_participants(text, integer)
  from public, anon, authenticated;

grant execute on function public.search_report_participants(text, integer)
  to service_role;

create index season_participants_rp_name_trgm_idx
  on public.season_participants
  using gin (rp_name extensions.gin_trgm_ops)
  where rp_name is not null;

create index streamers_name_trgm_idx
  on public.streamers
  using gin (name extensions.gin_trgm_ops);
