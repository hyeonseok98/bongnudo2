alter table public.replays
  add column sort_at timestamptz
  generated always as (coalesce(live_started_at, published_at)) stored;

create index replays_season_sort_at_id_idx
  on public.replays (season_id, sort_at desc nulls last, id desc);

create index replays_season_participant_sort_at_id_idx
  on public.replays (
    season_id,
    season_participant_id,
    sort_at desc nulls last,
    id desc
  )
  where season_participant_id is not null;
