create or replace function private.enforce_archive_immutable_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_without_recommendation public.archives%rowtype;
begin
  if new.archive_kind is distinct from old.archive_kind
    or new.structure_mode is distinct from old.structure_mode
  then
    raise exception 'archive_immutable_field_changed' using errcode = 'P0001';
  end if;

  if old.archive_kind = 'system_character' then
    v_new_without_recommendation := new;
    v_new_without_recommendation.recommendation_count := old.recommendation_count;

    if v_new_without_recommendation is distinct from old then
      raise exception 'system_archive_read_only' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;
