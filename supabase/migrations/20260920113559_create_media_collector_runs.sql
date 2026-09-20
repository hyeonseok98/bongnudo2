create table public.media_collector_runs (
  id uuid primary key default gen_random_uuid(),
  collector_kind text not null,
  status text not null default 'running',
  season_id smallint not null
    references public.seasons (id)
    on delete restrict,
  target_count integer not null check (target_count >= 0),
  next_offset integer not null default 0 check (next_offset >= 0),
  processed_participant_count integer not null default 0 check (processed_participant_count >= 0),
  page_count integer not null default 0 check (page_count >= 0),
  found_count integer not null default 0 check (found_count >= 0),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  lease_token uuid,
  lease_expires_at timestamptz,
  error_message text,
  constraint media_collector_runs_kind_check
    check (collector_kind in ('clips', 'replays')),
  constraint media_collector_runs_status_check
    check (status in ('running', 'completed', 'failed')),
  constraint media_collector_runs_completion_check
    check (
      (status = 'running' and completed_at is null)
      or (status in ('completed', 'failed') and completed_at is not null)
    )
);

create unique index media_collector_runs_one_running_kind_idx
  on public.media_collector_runs (collector_kind)
  where status = 'running';

create index media_collector_runs_recent_idx
  on public.media_collector_runs (collector_kind, started_at desc);

alter table public.media_collector_runs enable row level security;

revoke all privileges on table public.media_collector_runs
  from public, anon, authenticated;

grant select, insert, update on table public.media_collector_runs
  to service_role;

create or replace function public.claim_media_collector_batch(
  p_collector_kind text
)
returns table (
  run_id uuid,
  season_id smallint,
  target_count integer,
  next_offset integer,
  lease_token uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_run public.media_collector_runs%rowtype;
  v_season_id smallint;
  v_active_season_count integer;
  v_target_count integer;
  v_lease_token uuid := gen_random_uuid();
begin
  if p_collector_kind not in ('clips', 'replays') then
    raise exception '지원하지 않는 수집 종류입니다.';
  end if;

  select *
  into v_run
  from public.media_collector_runs
  where collector_kind = p_collector_kind
    and status = 'running'
  order by started_at desc
  limit 1
  for update;

  if found and v_run.lease_expires_at is not null and v_run.lease_expires_at > now() then
    return;
  end if;

  if not found then
    select count(*)::integer, min(season.id)
    into v_active_season_count, v_season_id
    from public.seasons as season
    where season.is_active;

    if v_active_season_count <> 1 then
      raise exception '활성 시즌은 정확히 하나여야 합니다.';
    end if;

    select count(*)::integer
    into v_target_count
    from public.season_participants as participant
    join public.streamers as streamer
      on streamer.id = participant.streamer_id
    where participant.season_id = v_season_id
      and streamer.chzzk_channel_id is not null;

    insert into public.media_collector_runs (
      collector_kind,
      season_id,
      target_count
    )
    values (
      p_collector_kind,
      v_season_id,
      v_target_count
    )
    returning * into v_run;
  end if;

  update public.media_collector_runs
  set lease_token = v_lease_token,
      lease_expires_at = now() + interval '10 minutes'
  where id = v_run.id;

  return query
  select
    v_run.id,
    v_run.season_id,
    v_run.target_count,
    v_run.next_offset,
    v_lease_token;
end;
$function$;

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

create or replace function public.fail_media_collector_run(
  p_run_id uuid,
  p_lease_token uuid,
  p_error_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.media_collector_runs
  set status = 'failed',
      completed_at = now(),
      lease_token = null,
      lease_expires_at = null,
      error_message = left(coalesce(p_error_message, '수집 작업에 실패했습니다.'), 500)
  where id = p_run_id
    and status = 'running'
    and lease_token = p_lease_token;
end;
$function$;

create or replace function public.dispatch_media_collector_batch(
  p_run_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_collector_kind text;
  v_request_id bigint;
begin
  select collector_kind
  into v_collector_kind
  from public.media_collector_runs
  where id = p_run_id
    and status = 'running';

  if v_collector_kind is null then
    raise exception '실행 중인 수집 작업을 찾지 못했습니다.';
  end if;

  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'media_collector_worker_url'
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'media_collector_cron_secret'
      )
    ),
    body := jsonb_build_object('kind', v_collector_kind),
    timeout_milliseconds := 120000
  )
  into v_request_id;

  return v_request_id;
end;
$function$;

revoke all on function public.claim_media_collector_batch(text) from public, anon, authenticated;
revoke all on function public.complete_media_collector_batch(uuid, uuid, integer, integer, integer, integer, integer, integer, boolean) from public, anon, authenticated;
revoke all on function public.fail_media_collector_run(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.dispatch_media_collector_batch(uuid) from public, anon, authenticated;

grant execute on function public.claim_media_collector_batch(text) to service_role;
grant execute on function public.complete_media_collector_batch(uuid, uuid, integer, integer, integer, integer, integer, integer, boolean) to service_role;
grant execute on function public.fail_media_collector_run(uuid, uuid, text) to service_role;
grant execute on function public.dispatch_media_collector_batch(uuid) to service_role;
