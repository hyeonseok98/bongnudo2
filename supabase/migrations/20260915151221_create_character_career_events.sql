alter table public.season_participants
  add column birth_date date,
  add column stated_age smallint,
  add constraint season_participants_stated_age_check
    check (stated_age is null or stated_age > 0);

alter table public.season_days
  add constraint season_days_id_season_id_key
    unique (id, season_id);

create table public.character_career_events (
  id uuid primary key default gen_random_uuid(),
  season_id smallint not null,
  participant_id uuid not null,
  event_type text not null,
  from_organization_id uuid,
  to_organization_id uuid,
  from_role text,
  to_role text,
  event_date date not null,
  event_at timestamptz,
  sequence_in_day integer not null,
  season_day_id uuid,
  note text,
  source_url text,
  created_at timestamptz not null default now(),
  constraint character_career_events_season_id_fkey
    foreign key (season_id)
    references public.seasons (id)
    on delete restrict,
  constraint character_career_events_participant_same_season_fkey
    foreign key (participant_id, season_id)
    references public.season_participants (id, season_id)
    on delete cascade,
  constraint character_career_events_from_organization_same_season_fkey
    foreign key (from_organization_id, season_id)
    references public.organizations (id, season_id)
    on delete restrict,
  constraint character_career_events_to_organization_same_season_fkey
    foreign key (to_organization_id, season_id)
    references public.organizations (id, season_id)
    on delete restrict,
  constraint character_career_events_season_day_same_season_fkey
    foreign key (season_day_id, season_id)
    references public.season_days (id, season_id)
    on delete set null (season_day_id),
  constraint character_career_events_type_check
    check (event_type in ('join', 'leave', 'promote', 'demote', 'transfer', 'appoint')),
  constraint character_career_events_sequence_in_day_check
    check (sequence_in_day > 0),
  constraint character_career_events_event_date_matches_event_at_check
    check (
      event_at is null
      or (event_at at time zone 'Asia/Seoul')::date = event_date
    ),
  constraint character_career_events_participant_date_sequence_key
    unique (participant_id, event_date, sequence_in_day)
);

create index character_career_events_season_id_idx
  on public.character_career_events (season_id);

create index character_career_events_from_organization_id_idx
  on public.character_career_events (from_organization_id)
  where from_organization_id is not null;

create index character_career_events_to_organization_id_idx
  on public.character_career_events (to_organization_id)
  where to_organization_id is not null;

create index character_career_events_season_day_id_idx
  on public.character_career_events (season_day_id)
  where season_day_id is not null;

alter table public.character_career_events enable row level security;

revoke all privileges on table public.character_career_events
from anon, authenticated;

grant select on table public.character_career_events
to anon, authenticated;

create policy "character career events are publicly readable"
on public.character_career_events for select
to anon, authenticated
using (true);
