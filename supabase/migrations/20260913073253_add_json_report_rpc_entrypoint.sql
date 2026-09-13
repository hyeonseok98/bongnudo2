create function public.create_report(p_payload jsonb)
returns table (
  created_report_id uuid,
  created_timeline_event_id uuid
)
language sql
security invoker
set search_path = ''
as $$
  select result.created_report_id, result.created_timeline_event_id
  from public.create_report(
    (p_payload ->> 'reportId')::uuid,
    (p_payload ->> 'timelineEventId')::uuid,
    (p_payload ->> 'reporterUserId')::uuid,
    (p_payload ->> 'seasonId')::smallint,
    p_payload ->> 'reportType',
    (p_payload ->> 'categoryId')::uuid,
    p_payload ->> 'title',
    p_payload ->> 'content',
    (p_payload ->> 'occurredAt')::timestamptz,
    array(
      select participant_id::uuid
      from jsonb_array_elements_text(
        coalesce(p_payload -> 'participantIds', '[]'::jsonb)
      ) as participant(participant_id)
    ),
    array(
      select tag_id::uuid
      from jsonb_array_elements_text(
        coalesce(p_payload -> 'tagIds', '[]'::jsonb)
      ) as tag(tag_id)
    ),
    coalesce(p_payload -> 'images', '[]'::jsonb),
    array(
      select clip_url
      from jsonb_array_elements_text(
        coalesce(p_payload -> 'clipUrls', '[]'::jsonb)
      ) as clip(clip_url)
    )
  ) as result;
$$;

revoke execute on function public.create_report(jsonb)
  from public, anon, authenticated;

grant execute on function public.create_report(jsonb)
  to service_role;
