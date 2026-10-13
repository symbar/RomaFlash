-- 1. Rimuovi vecchio job che falliva per sintassi
SELECT cron.unschedule('invoke-daily-briefing') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invoke-daily-briefing');

-- 2. Rimuovi e rischedula generate-daily-briefing con timeout adeguato (120 secondi invece dei 5 secondi di default)
SELECT cron.unschedule('generate-daily-briefing') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-briefing');

SELECT cron.schedule(
  'generate-daily-briefing',
  '0 20 * * *',
  $$
    SELECT net.http_post(
      url := 'https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/daily-briefing',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtranhtamJ1emdhcnhsbGJ6a2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDcxNDQsImV4cCI6MjEwNjAyMzE0NH0.GahiUgIxEJf_KZ5bC7hTXdUr6o67VOLUcCollg8wKgM"}'::jsonb,
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    ) as request_id;
  $$
);
