create extension if not exists pg_net with schema extensions;

create table public.live_viewer_snapshots (
  id uuid primary key default gen_random_uuid(),
  season_participant_id uuid not null,
  viewer_count integer not null,
  sampled_at timestamptz not null,
  constraint live_viewer_snapshots_season_participant_id_fkey
    foreign key (season_participant_id)
    references public.season_participants (id)
    on delete cascade,
  constraint live_viewer_snapshots_viewer_count_check
    check (viewer_count >= 0),
  constraint live_viewer_snapshots_participant_sampled_at_key
    unique (season_participant_id, sampled_at)
);

create index live_viewer_snapshots_sampled_at_idx
  on public.live_viewer_snapshots (sampled_at desc);

alter table public.live_viewer_snapshots enable row level security;

revoke all privileges on table public.live_viewer_snapshots
  from anon, authenticated;

grant select, insert on table public.live_viewer_snapshots
  to service_role;

create view public.live_viewer_snapshots_view
with (security_invoker = true)
as
select
  snapshot.id,
  streamer.name as streamer_name,
  participant.rp_name,
  snapshot.viewer_count,
  snapshot.sampled_at,
  snapshot.season_participant_id
from public.live_viewer_snapshots as snapshot
join public.season_participants as participant
  on participant.id = snapshot.season_participant_id
join public.streamers as streamer
  on streamer.id = participant.streamer_id;

revoke all privileges on table public.live_viewer_snapshots_view
  from anon, authenticated;

grant select on table public.live_viewer_snapshots_view
  to service_role;
