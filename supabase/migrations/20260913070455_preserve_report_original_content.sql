create function private.preserve_report_original_content()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if row(
    new.id,
    new.reporter_user_id,
    new.season_id,
    new.report_type,
    new.category_id,
    new.timeline_event_id,
    new.title,
    new.content,
    new.occurred_at,
    new.created_at
  ) is distinct from row(
    old.id,
    old.reporter_user_id,
    old.season_id,
    old.report_type,
    old.category_id,
    old.timeline_event_id,
    old.title,
    old.content,
    old.occurred_at,
    old.created_at
  ) then
    raise exception 'original report content cannot be changed'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.preserve_report_original_content()
  from public, anon, authenticated;

create trigger reports_preserve_original_content_trigger
before update on public.reports
for each row
execute function private.preserve_report_original_content();
