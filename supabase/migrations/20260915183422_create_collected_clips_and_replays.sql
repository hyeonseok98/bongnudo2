create table public.clips (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'chzzk',
  provider_clip_id text not null,
  provider_video_id text,
  streamer_id uuid not null,
  season_id smallint not null,
  season_participant_id uuid,
  season_day_id uuid,
  title text not null,
  thumbnail_url text,
  clip_url text not null,
  duration_seconds integer,
  view_count bigint,
  clip_created_at timestamptz not null,
  collected_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clips_provider_clip_key unique (provider, provider_clip_id),
  constraint clips_streamer_id_fkey
    foreign key (streamer_id)
    references public.streamers (id)
    on delete restrict,
  constraint clips_season_id_fkey
    foreign key (season_id)
    references public.seasons (id)
    on delete restrict,
  constraint clips_participant_same_season_fkey
    foreign key (season_participant_id, season_id)
    references public.season_participants (id, season_id)
    on delete set null (season_participant_id),
  constraint clips_season_day_same_season_fkey
    foreign key (season_day_id, season_id)
    references public.season_days (id, season_id)
    on delete set null (season_day_id),
  constraint clips_duration_seconds_check
    check (duration_seconds is null or duration_seconds >= 0),
  constraint clips_view_count_check
    check (view_count is null or view_count >= 0)
);

create index clips_season_day_id_idx
  on public.clips (season_id, season_day_id)
  where season_day_id is not null;

create index clips_streamer_created_at_idx
  on public.clips (streamer_id, clip_created_at desc);

create index clips_participant_created_at_idx
  on public.clips (season_participant_id, clip_created_at desc)
  where season_participant_id is not null;

create table public.replays (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'chzzk',
  provider_video_id text not null,
  provider_video_no bigint,
  streamer_id uuid not null,
  season_id smallint not null,
  season_participant_id uuid,
  season_day_id uuid,
  title text not null,
  thumbnail_url text,
  replay_url text not null,
  duration_seconds integer,
  view_count bigint,
  live_started_at timestamptz,
  published_at timestamptz,
  collected_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint replays_provider_video_key unique (provider, provider_video_id),
  constraint replays_streamer_id_fkey
    foreign key (streamer_id)
    references public.streamers (id)
    on delete restrict,
  constraint replays_season_id_fkey
    foreign key (season_id)
    references public.seasons (id)
    on delete restrict,
  constraint replays_participant_same_season_fkey
    foreign key (season_participant_id, season_id)
    references public.season_participants (id, season_id)
    on delete set null (season_participant_id),
  constraint replays_season_day_same_season_fkey
    foreign key (season_day_id, season_id)
    references public.season_days (id, season_id)
    on delete set null (season_day_id),
  constraint replays_duration_seconds_check
    check (duration_seconds is null or duration_seconds >= 0),
  constraint replays_view_count_check
    check (view_count is null or view_count >= 0)
);

create index replays_season_day_id_idx
  on public.replays (season_id, season_day_id)
  where season_day_id is not null;

create index replays_streamer_published_at_idx
  on public.replays (streamer_id, published_at desc);

create index replays_participant_published_at_idx
  on public.replays (season_participant_id, published_at desc)
  where season_participant_id is not null;

alter table public.clips enable row level security;
alter table public.replays enable row level security;

revoke all privileges on table public.clips, public.replays
from anon, authenticated;

grant select on table public.clips, public.replays
to anon, authenticated;

grant select, insert, update on table public.clips, public.replays
to service_role;

create policy "clips are publicly readable"
on public.clips for select
to anon, authenticated
using (true);

create policy "replays are publicly readable"
on public.replays for select
to anon, authenticated
using (true);
