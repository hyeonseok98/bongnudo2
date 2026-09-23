-- Run manually only after the production refresh endpoint is deployed and
-- returns 401 without Authorization.
-- Required Vault secret names:
--   live_viewer_snapshots_url
--     Value: https://www.bongnurok.site/api/internal/live-refresh
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
    'live-refresh-server-evening',
    'live-refresh-server-midnight',
    'live-refresh-server-0400',
    'live-refresh-offhours-evening',
    'live-refresh-offhours-morning',
    'collect-live-viewer-snapshots-evening-kst',
    'collect-live-viewer-snapshots-after-midnight-kst',
    'refresh-live-current-peak-kst',
    'refresh-live-current-0400-kst',
    'refresh-live-current-off-hours-0405-kst',
    'refresh-live-current-off-hours-0401-kst',
    'refresh-live-current-off-hours-kst',
    'refresh-live-current-off-hours-evening-kst',
    'refresh-live-current-off-hours-morning-kst'
  );

  perform cron.schedule(
    'live-refresh-server-evening',
    '* 9-18 * * *',
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
        timeout_milliseconds := 120000
      );
    $job$
  );

  perform cron.schedule(
    'live-refresh-server-0400',
    '0 19 * * *',
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
        timeout_milliseconds := 120000
      );
    $job$
  );

  perform cron.schedule(
    'live-refresh-offhours-evening',
    '1-59/2 19-23 * * *',
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
        timeout_milliseconds := 120000
      );
    $job$
  );

  perform cron.schedule(
    'live-refresh-offhours-morning',
    '1-59/2 0-8 * * *',
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
        timeout_milliseconds := 120000
      );
    $job$
  );
end
$setup$;
