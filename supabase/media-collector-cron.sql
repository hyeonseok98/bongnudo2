-- Run after the media-collector Edge Function and its Vault secrets are deployed.
-- Required Vault secret names:
--   media_collector_worker_url
--   media_collector_cron_secret

do $setup$
declare
  cron_timezone text := coalesce(current_setting('cron.timezone', true), 'GMT');
begin
  if cron_timezone not in ('GMT', 'UTC') then
    raise exception 'Expected pg_cron timezone GMT/UTC, got %', cron_timezone;
  end if;

  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'media_collector_worker_url'
      and decrypted_secret <> ''
  ) then
    raise exception 'Vault secret media_collector_worker_url is missing';
  end if;

  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'media_collector_cron_secret'
      and decrypted_secret <> ''
  ) then
    raise exception 'Vault secret media_collector_cron_secret is missing';
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname in (
    'collect-bongnudo2-clips-daily-kst',
    'collect-bongnudo2-replays-daily-kst'
  );

  -- 04:00 KST on the following local day is 19:00 UTC.
  perform cron.schedule(
    'collect-bongnudo2-clips-daily-kst',
    '0 19 * * *',
    $job$
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
        body := '{"kind":"clips"}'::jsonb,
        timeout_milliseconds := 120000
      );
    $job$
  );

  -- 09:00 KST is 00:00 UTC.
  perform cron.schedule(
    'collect-bongnudo2-replays-daily-kst',
    '0 0 * * *',
    $job$
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
        body := '{"kind":"replays"}'::jsonb,
        timeout_milliseconds := 120000
      );
    $job$
  );
end
$setup$;
