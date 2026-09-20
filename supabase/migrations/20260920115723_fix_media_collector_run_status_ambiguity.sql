create or replace function public.complete_media_collector_batch(
  p_run_id uuid,
  p_lease_token uuid,
  p_processed_participant_count integer,
  p_page_count integer,
  p_found_count integer,
  p_inserted_count integer,
  p_updated_count integer,
  p_failed_count integer,
  p_is_last_batch boolean
)
returns table (
  has_more boolean,
  status text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_run public.media_collector_runs%rowtype;
  v_next_offset integer;
begin
  if p_processed_participant_count < 0
    or p_page_count < 0
    or p_found_count < 0
    or p_inserted_count < 0
    or p_updated_count < 0
    or p_failed_count < 0 then
    raise exception '수집 통계는 음수일 수 없습니다.';
  end if;

  select *
  into v_run
  from public.media_collector_runs as collector_run
  where collector_run.id = p_run_id
    and collector_run.status = 'running'
    and collector_run.lease_token = p_lease_token
  for update;

  if not found then
    raise exception '수집 실행 권한이 만료되었거나 완료되었습니다.';
  end if;

  v_next_offset := v_run.next_offset + p_processed_participant_count;

  update public.media_collector_runs
  set next_offset = v_next_offset,
      processed_participant_count = processed_participant_count + p_processed_participant_count,
      page_count = page_count + p_page_count,
      found_count = found_count + p_found_count,
      inserted_count = inserted_count + p_inserted_count,
      updated_count = updated_count + p_updated_count,
      failed_count = failed_count + p_failed_count,
      status = case
        when p_is_last_batch or v_next_offset >= v_run.target_count then 'completed'
        else 'running'
      end,
      completed_at = case
        when p_is_last_batch or v_next_offset >= v_run.target_count then now()
        else null
      end,
      lease_token = null,
      lease_expires_at = null
  where id = v_run.id;

  return query
  select
    not (p_is_last_batch or v_next_offset >= v_run.target_count),
    case
      when p_is_last_batch or v_next_offset >= v_run.target_count then 'completed'
      else 'running'
    end;
end;
$function$;
