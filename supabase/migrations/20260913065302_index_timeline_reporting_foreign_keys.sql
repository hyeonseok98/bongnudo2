drop index public.timeline_event_participants_participant_id_idx;

create index timeline_event_participants_participant_id_idx
  on public.timeline_event_participants (
    season_participant_id,
    season_id,
    timeline_event_id
  );

create index timeline_event_participants_event_season_id_idx
  on public.timeline_event_participants (timeline_event_id, season_id);

drop index public.report_participants_participant_id_idx;

create index report_participants_participant_id_idx
  on public.report_participants (
    season_participant_id,
    season_id,
    report_id
  );

create index report_participants_report_season_id_idx
  on public.report_participants (report_id, season_id);

drop index public.reports_category_id_idx;

create index reports_category_id_idx
  on public.reports (category_id, report_type)
  where category_id is not null;

drop index public.reports_timeline_event_id_idx;

create index reports_timeline_event_id_idx
  on public.reports (timeline_event_id, season_id)
  where timeline_event_id is not null;

drop index public.timeline_events_merged_into_event_id_idx;

create index timeline_events_merged_into_event_id_idx
  on public.timeline_events (merged_into_event_id, season_id)
  where merged_into_event_id is not null;
