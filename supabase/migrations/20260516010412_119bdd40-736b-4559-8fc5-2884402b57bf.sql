TRUNCATE TABLE cron.job_run_details;
TRUNCATE TABLE net._http_response;

DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'prune-system-logs';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
END $$;

SELECT cron.schedule(
  'prune-system-logs',
  '0 3 * * *',
  $$
    DELETE FROM cron.job_run_details WHERE end_time < now() - interval '3 days';
    DELETE FROM net._http_response WHERE created < now() - interval '3 days';
  $$
);