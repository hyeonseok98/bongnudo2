update public.character_career_events as event
set event_at = membership.joined_at
from public.organization_memberships as membership
where event.participant_id = membership.participant_id
  and event.to_organization_id = membership.organization_id
  and event.event_type = 'join'
  and event.note = '기존 소속 정보'
  and event.event_at is null
  and membership.joined_at is not null
  and (membership.joined_at at time zone 'Asia/Seoul')::date = event.event_date;
