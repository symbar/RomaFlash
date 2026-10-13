-- Schedulazione automatica de "L'Analista" (Controllo post-partita ogni 30 minuti)
SELECT cron.unschedule('check-post-match-analyst') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-post-match-analyst');

SELECT cron.schedule(
  'check-post-match-analyst',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/match-analyst',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtranhtamJ1emdhcnhsbGJ6a2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDcxNDQsImV4cCI6MjEwNjAyMzE0NH0.GahiUgIxEJf_KZ5bC7hTXdUr6o67VOLUcCollg8wKgM"}'::jsonb,
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    ) as request_id;
  $$
);
