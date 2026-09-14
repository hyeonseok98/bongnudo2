alter table public.timeline_events
  drop constraint timeline_events_content_length_check,
  add constraint timeline_events_content_length_check
    check (char_length(content) between 1 and 400);

alter table public.reports
  drop constraint reports_content_length_check,
  add constraint reports_content_length_check
    check (char_length(content) between 1 and 400);

update public.report_categories
set sort_order = 10,
    updated_at = now()
where report_type = 'timeline'
  and slug = 'other';

insert into public.report_categories (report_type, slug, name, sort_order)
values
  ('timeline', 'article', '기사', 8),
  ('timeline', 'crime', '범죄', 9)
on conflict (report_type, slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

create index timeline_events_published_season_deterministic_idx
  on public.timeline_events (season_id, occurred_at desc, created_at desc, id desc)
  where publication_status = 'published' and merged_into_event_id is null;

create or replace function public.get_timeline_page(p_filters jsonb)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive input as (
    select
      (p_filters ->> 'dateStart')::timestamptz as date_start,
      (p_filters ->> 'dateEnd')::timestamptz as date_end,
      nullif(trim(p_filters ->> 'categorySlug'), '') as category_slug,
      nullif(trim(p_filters ->> 'job'), '') as job,
      nullif(trim(p_filters ->> 'affiliation'), '') as affiliation,
      nullif(trim(p_filters ->> 'participantId'), '')::uuid as participant_id,
      nullif(trim(p_filters ->> 'tagSlug'), '') as tag_slug,
      nullif(trim(p_filters ->> 'search'), '') as search,
      case when p_filters ->> 'sort' = 'asc' then 'asc' else 'desc' end as sort,
      least(greatest(coalesce((p_filters ->> 'limit')::integer, 200), 1), 200) as result_limit
  ),
  search_input as (
    select
      input.*,
      case
        when input.search is null then null
        else '%' || replace(
          replace(replace(input.search, '\', '\\'), '%', '\%'),
          '_', '\_'
        ) || '%'
      end as search_pattern
    from input
  ),
  selected_affiliations as (
    select affiliation.id
    from public.streamer_affiliations as affiliation
    cross join search_input
    where affiliation.slug = search_input.affiliation

    union all

    select child.id
    from public.streamer_affiliations as child
    join selected_affiliations as parent
      on parent.id = child.parent_affiliation_id
  ),
  scoped_events as materialized (
    select event.*
    from public.timeline_events as event
    join public.seasons as season
      on season.id = event.season_id
      and season.is_active = true
    join public.report_categories as category
      on category.id = event.category_id
      and category.report_type = 'timeline'
    cross join search_input
    where event.publication_status = 'published'
      and event.merged_into_event_id is null
      and event.occurred_at >= search_input.date_start
      and event.occurred_at < search_input.date_end
      and (
        search_input.category_slug is null
        or category.slug = search_input.category_slug
      )
      and (
        search_input.job is null
        or exists (
          select 1
          from public.timeline_event_participants as event_participant
          join public.organization_memberships as membership
            on membership.participant_id = event_participant.season_participant_id
            and membership.left_at is null
          join public.organizations as organization
            on organization.id = membership.organization_id
          where event_participant.timeline_event_id = event.id
            and exists (
              select 1
              from public.organization_role_histories as role_history
              where role_history.membership_id = membership.id
                and role_history.end_date is null
            )
            and (
              organization.slug = search_input.job
              or case organization.type
                when 'institution' then 'public-service'
                when 'public-service' then 'public-service'
                when 'business' then 'business'
                when 'illegal-business' then 'illegal-business'
                when 'gang' then 'gang'
                when 'crew' then 'crew'
                else null
              end = search_input.job
            )
        )
      )
      and (
        search_input.affiliation is null
        or exists (
          select 1
          from public.timeline_event_participants as event_participant
          join public.season_participants as participant
            on participant.id = event_participant.season_participant_id
          join public.streamer_affiliation_memberships as membership
            on membership.streamer_id = participant.streamer_id
          where event_participant.timeline_event_id = event.id
            and membership.affiliation_id in (
              select selected_affiliations.id from selected_affiliations
            )
        )
      )
      and (
        search_input.participant_id is null
        or exists (
          select 1
          from public.timeline_event_participants as event_participant
          where event_participant.timeline_event_id = event.id
            and event_participant.season_participant_id = search_input.participant_id
        )
      )
      and (
        search_input.search is null
        or event.title ilike search_input.search_pattern escape '\'
        or event.content ilike search_input.search_pattern escape '\'
        or exists (
          select 1
          from public.timeline_event_participants as event_participant
          join public.season_participants as participant
            on participant.id = event_participant.season_participant_id
          join public.streamers as streamer
            on streamer.id = participant.streamer_id
          where event_participant.timeline_event_id = event.id
            and (
              participant.rp_name ilike search_input.search_pattern escape '\'
              or streamer.name ilike search_input.search_pattern escape '\'
            )
        )
        or exists (
          select 1
          from public.timeline_event_tags as event_tag
          join public.timeline_tags as tag on tag.id = event_tag.tag_id
          where event_tag.timeline_event_id = event.id
            and tag.name ilike search_input.search_pattern escape '\'
        )
      )
  ),
  filtered_events as materialized (
    select event.*
    from scoped_events as event
    cross join search_input
    where search_input.tag_slug is null
      or exists (
        select 1
        from public.timeline_event_tags as event_tag
        join public.timeline_tags as tag on tag.id = event_tag.tag_id
        where event_tag.timeline_event_id = event.id
          and tag.slug = search_input.tag_slug
      )
  ),
  limited_events as (
    select event.*
    from filtered_events as event
    cross join search_input
    order by
      case when search_input.sort = 'asc' then event.occurred_at end asc,
      case when search_input.sort = 'asc' then event.created_at end asc,
      case when search_input.sort = 'asc' then event.id end asc,
      case when search_input.sort = 'desc' then event.occurred_at end desc,
      case when search_input.sort = 'desc' then event.created_at end desc,
      case when search_input.sort = 'desc' then event.id end desc
    limit (select result_limit from search_input)
  ),
  event_rows as (
    select
      event.occurred_at,
      event.created_at,
      event.id,
      jsonb_build_object(
        'id', event.id,
        'title', event.title,
        'content', event.content,
        'occurredAt', event.occurred_at,
        'createdAt', event.created_at,
        'category', jsonb_build_object('slug', category.slug, 'name', category.name),
        'participants', coalesce(participants.items, '[]'::jsonb),
        'tags', coalesce(tags.items, '[]'::jsonb),
        'media', coalesce(media.items, '[]'::jsonb),
        'reportCount', (
          select count(*) from public.reports as report
          where report.timeline_event_id = event.id
        )
      ) as item
    from limited_events as event
    join public.report_categories as category on category.id = event.category_id
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'seasonParticipantId', event_participant.season_participant_id,
          'rpName', participant.rp_name,
          'streamerName', streamer.name,
          'profileImageKey', participant.portrait_image_key,
          'isPrimary', event_participant.is_primary
        )
        order by event_participant.is_primary desc, event_participant.sort_order
      ) as items
      from public.timeline_event_participants as event_participant
      join public.season_participants as participant
        on participant.id = event_participant.season_participant_id
      join public.streamers as streamer on streamer.id = participant.streamer_id
      where event_participant.timeline_event_id = event.id
    ) as participants on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('slug', tag.slug, 'name', tag.name)
        order by event_tag.sort_order
      ) as items
      from public.timeline_event_tags as event_tag
      join public.timeline_tags as tag on tag.id = event_tag.tag_id
      where event_tag.timeline_event_id = event.id
    ) as tags on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'id', event_media.id,
          'mediaType', event_media.media_type,
          'objectKey', event_media.object_key,
          'clipUrl', event_media.clip_url
        )
        order by
          case event_media.media_type when 'chzzk_clip' then 0 else 1 end,
          event_media.sort_order,
          event_media.id
      ) as items
      from public.timeline_event_media as event_media
      where event_media.timeline_event_id = event.id
    ) as media on true
  ),
  popular_tags as (
    select tag.slug, tag.name, count(distinct event_tag.timeline_event_id) as usage_count
    from scoped_events as event
    join public.timeline_event_tags as event_tag on event_tag.timeline_event_id = event.id
    join public.timeline_tags as tag
      on tag.id = event_tag.tag_id
      and tag.is_active = true
    group by tag.id, tag.slug, tag.name
    order by usage_count desc, tag.name, tag.slug
    limit 8
  )
  select jsonb_build_object(
    'events', coalesce(
      (
        select jsonb_agg(
          event_rows.item
          order by
            case when (select sort from search_input) = 'asc' then event_rows.occurred_at end asc,
            case when (select sort from search_input) = 'asc' then event_rows.created_at end asc,
            case when (select sort from search_input) = 'asc' then event_rows.id end asc,
            case when (select sort from search_input) = 'desc' then event_rows.occurred_at end desc,
            case when (select sort from search_input) = 'desc' then event_rows.created_at end desc,
            case when (select sort from search_input) = 'desc' then event_rows.id end desc
        )
        from event_rows
      ),
      '[]'::jsonb
    ),
    'categories', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('slug', category.slug, 'name', category.name)
          order by category.sort_order, category.name
        )
        from public.report_categories as category
        where category.report_type = 'timeline'
          and category.is_active = true
          and category.slug not in ('job-economy', 'notice-guide')
      ),
      '[]'::jsonb
    ),
    'popularTags', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'slug', popular_tags.slug,
            'name', popular_tags.name,
            'usageCount', popular_tags.usage_count
          )
          order by popular_tags.usage_count desc, popular_tags.name, popular_tags.slug
        )
        from popular_tags
      ),
      '[]'::jsonb
    ),
    'totalCount', (select count(*) from filtered_events),
    'isTruncated', (
      select count(*) > (select result_limit from search_input)
      from filtered_events
    )
  );
$$;

revoke execute on function public.get_timeline_page(jsonb)
  from public, anon, authenticated;

grant execute on function public.get_timeline_page(jsonb)
  to service_role;
