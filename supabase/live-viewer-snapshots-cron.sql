-- Run only after the production endpoint returns 401 without Authorization.
-- Required Vault secret names:
--   live_viewer_snapshots_url
--   live_viewer_snapshots_cron_secret

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
    where name = 'live_viewer_snapshots_url'
      and decrypted_secret <> ''
  ) then
    raise exception 'Vault secret live_viewer_snapshots_url is missing';
  end if;

  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'live_viewer_snapshots_cron_secret'
      and decrypted_secret <> ''
  ) then
    raise exception 'Vault secret live_viewer_snapshots_cron_secret is missing';
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname in (
    'collect-live-viewer-snapshots-evening-kst',
    'collect-live-viewer-snapshots-after-midnight-kst'
  );

  perform cron.schedule(
    'collect-live-viewer-snapshots-evening-kst',
    '* 8-14 * * *',
    $job$
      select net.http_post(
        url := (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'live_viewer_snapshots_url'
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'live_viewer_snapshots_cron_secret'
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
      );
    $job$
  );

  perform cron.schedule(
    'collect-live-viewer-snapshots-after-midnight-kst',
    '* 15-18 * * *',
    $job$
      select net.http_post(
        url := (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'live_viewer_snapshots_url'
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'live_viewer_snapshots_cron_secret'
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
      );
    $job$
  );
end
$setup$;
