revoke all privileges on table
  public.report_categories,
  public.timeline_tags,
  public.timeline_events,
  public.reports,
  public.timeline_event_participants,
  public.report_participants,
  public.timeline_event_tags,
  public.report_tags,
  public.report_media,
  public.timeline_event_media,
  public.timeline_event_revisions,
  public.report_user_restrictions
from service_role;

grant select, insert, update on table
  public.report_categories,
  public.timeline_tags,
  public.timeline_events,
  public.reports
to service_role;

grant select, insert on table
  public.report_participants,
  public.report_tags,
  public.report_media,
  public.timeline_event_revisions
to service_role;

grant select, insert, update, delete on table
  public.timeline_event_participants,
  public.timeline_event_tags,
  public.timeline_event_media,
  public.report_user_restrictions
to service_role;
