CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Schedulazione Probabili Formazioni (Fantacalcio.it): ogni 1 ora al minuto 0
SELECT cron.unschedule('update-lineups-every-hour') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update-lineups-every-hour');
SELECT cron.schedule(
  'update-lineups-every-hour',
  '0 * * * *',
  $$
    SELECT net.http_post(
        url:='https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/scrape-lineups',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtranhtamJ1emdhcnhsbGJ6a2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDcxNDQsImV4cCI6MjEwNjAyMzE0NH0.GahiUgIxEJf_KZ5bC7hTXdUr6o67VOLUcCollg8wKgM"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 2. Schedulazione Classifica e Calendario (Football-Data API): ogni 6 ore
SELECT cron.unschedule('update-standings-and-calendar') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update-standings-and-calendar');
SELECT cron.schedule(
  'update-standings-and-calendar',
  '0 */6 * * *',
  $$
    SELECT net.http_post(
        url:='https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/fetch-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtranhtamJ1emdhcnhsbGJ6a2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDcxNDQsImV4cCI6MjEwNjAyMzE0NH0.GahiUgIxEJf_KZ5bC7hTXdUr6o67VOLUcCollg8wKgM"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
