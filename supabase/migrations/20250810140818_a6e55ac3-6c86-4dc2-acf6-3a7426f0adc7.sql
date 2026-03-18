-- Enable required extensions for scheduled HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create or replace a daily cron job at 03:00 UTC to invoke the cleanup edge function
DO $do$
DECLARE
  v_jobid INTEGER;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'cleanup-old-deleted-notes-daily' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;

  PERFORM cron.schedule(
    'cleanup-old-deleted-notes-daily',
    '0 3 * * *',
    $job$
    SELECT
      net.http_post(
        url := 'https://viidccjyjeipulbqqwua.supabase.co/functions/v1/cleanup-deleted-notes',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpaWRjY2p5amVpcHVsYnFxd3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjY4ODEsImV4cCI6MjA2ODM0Mjg4MX0._79sE__CrRgSOMuycMUt5_3tH2oyWC91TDiz4qleOJA"}'::jsonb,
        body := '{}'::jsonb
      );
    $job$
  );
END
$do$;

-- Run once immediately to clear any overdue notes right away
SELECT
  net.http_post(
    url := 'https://viidccjyjeipulbqqwua.supabase.co/functions/v1/cleanup-deleted-notes',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpaWRjY2p5amVpcHVsYnFxd3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjY4ODEsImV4cCI6MjA2ODM0Mjg4MX0._79sE__CrRgSOMuycMUt5_3tH2oyWC91TDiz4qleOJA"}'::jsonb,
    body := '{}'::jsonb
  );