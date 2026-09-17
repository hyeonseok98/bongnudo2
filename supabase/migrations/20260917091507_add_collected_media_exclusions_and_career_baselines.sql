alter table public.clips
  add column excluded_at timestamptz,
  add column excluded_by uuid
    references public.users (id)
    on delete set null;

alter table public.replays
  add column excluded_at timestamptz,
  add column excluded_by uuid
    references public.users (id)
    on delete set null;

drop policy "clips are publicly readable" on public.clips;

create policy "clips are publicly readable"
on public.clips for select
to anon, authenticated
using (excluded_at is null);

drop policy "replays are publicly readable" on public.replays;

create policy "replays are publicly readable"
on public.replays for select
to anon, authenticated
using (excluded_at is null);

with active_memberships as (
  select
    membership.participant_id,
    organization.season_id,
    organization.id as organization_id,
    membership.role,
    (membership.joined_at at time zone 'Asia/Seoul')::date as event_date
  from public.organization_memberships as membership
  join public.season_participants as participant
    on participant.id = membership.participant_id
  join public.organizations as organization
    on organization.id = membership.organization_id
  where membership.joined_at is not null
    and membership.left_at is null
    and participant.season_id = organization.season_id
),
numbered_memberships as (
  select
    active_memberships.*,
    row_number() over (
      partition by participant_id, event_date
      order by organization_id
    )::integer as sequence_in_day
  from active_memberships
)
insert into public.character_career_events (
  season_id,
  participant_id,
  event_type,
  to_organization_id,
  to_role,
  event_date,
  event_at,
  sequence_in_day,
  note
)
select
  season_id,
  participant_id,
  'join',
  organization_id,
  role,
  event_date,
  null,
  sequence_in_day,
  '기존 소속 정보'
from numbered_memberships
on conflict on constraint character_career_events_participant_date_sequence_key
do nothing;
