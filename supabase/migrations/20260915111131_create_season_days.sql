create table public.season_days (
  id uuid primary key default gen_random_uuid(),
  season_id smallint not null,
  day_number integer not null,
  session_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint season_days_season_id_fkey
    foreign key (season_id)
    references public.seasons (id)
    on delete restrict,
  constraint season_days_season_day_number_key
    unique (season_id, day_number),
  constraint season_days_day_number_check
    check (day_number > 0),
  constraint season_days_time_order_check
    check (ends_at > starts_at)
);

alter table public.season_days enable row level security;

insert into public.season_days (
  season_id,
  day_number,
  session_date,
  starts_at,
  ends_at
)
values
  (2, 1, date '2026-09-14', timestamptz '2026-09-14 18:00:00+09', timestamptz '2026-09-15 03:00:00+09'),
  (2, 2, date '2026-09-15', timestamptz '2026-09-15 18:00:00+09', timestamptz '2026-09-16 03:00:00+09'),
  (2, 3, date '2026-09-16', timestamptz '2026-09-16 18:00:00+09', timestamptz '2026-09-17 03:00:00+09'),
  (2, 4, date '2026-09-17', timestamptz '2026-09-17 18:00:00+09', timestamptz '2026-09-18 03:00:00+09'),
  (2, 5, date '2026-09-19', timestamptz '2026-09-19 18:00:00+09', timestamptz '2026-09-20 03:00:00+09'),
  (2, 6, date '2026-09-20', timestamptz '2026-09-20 18:00:00+09', timestamptz '2026-09-21 03:00:00+09'),
  (2, 7, date '2026-09-21', timestamptz '2026-09-21 18:00:00+09', timestamptz '2026-09-22 03:00:00+09'),
  (2, 8, date '2026-09-22', timestamptz '2026-09-22 18:00:00+09', timestamptz '2026-09-23 03:00:00+09'),
  (2, 9, date '2026-09-23', timestamptz '2026-09-23 18:00:00+09', timestamptz '2026-09-24 03:00:00+09'),
  (2, 10, date '2026-09-24', timestamptz '2026-09-24 18:00:00+09', timestamptz '2026-09-25 03:00:00+09'),
  (2, 11, date '2026-09-26', timestamptz '2026-09-26 18:00:00+09', timestamptz '2026-09-27 03:00:00+09'),
  (2, 12, date '2026-09-27', timestamptz '2026-09-27 18:00:00+09', timestamptz '2026-09-28 03:00:00+09'),
  (2, 13, date '2026-09-28', timestamptz '2026-09-28 18:00:00+09', timestamptz '2026-09-29 03:00:00+09'),
  (2, 14, date '2026-09-29', timestamptz '2026-09-29 18:00:00+09', timestamptz '2026-09-30 03:00:00+09'),
  (2, 15, date '2026-09-30', timestamptz '2026-09-30 18:00:00+09', timestamptz '2026-10-01 03:00:00+09'),
  (2, 16, date '2026-10-01', timestamptz '2026-10-01 18:00:00+09', timestamptz '2026-10-02 03:00:00+09'),
  (2, 17, date '2026-10-03', timestamptz '2026-10-03 18:00:00+09', timestamptz '2026-10-04 03:00:00+09'),
  (2, 18, date '2026-10-04', timestamptz '2026-10-04 18:00:00+09', timestamptz '2026-10-05 03:00:00+09')
on conflict (season_id, day_number) do update
set
  session_date = excluded.session_date,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at;
