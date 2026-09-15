create index clips_season_created_cursor_idx
  on public.clips (season_id, clip_created_at desc, id desc);

create index clips_participant_created_cursor_idx
  on public.clips (season_participant_id, clip_created_at desc, id desc)
  where season_participant_id is not null;
