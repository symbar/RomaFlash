-- Aggiorna la schedulazione del crawler fetch-news con timeout adeguato (120 secondi invece dei 5 secondi di default di pg_net)
-- Frequenza: ogni 15 minuti ('*/15 * * * *')

SELECT cron.unschedule('invoke-fetch-news') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invoke-fetch-news');

SELECT cron.schedule(
  'invoke-fetch-news',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
      url:='https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/fetch-news',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:='{}'::jsonb,
      timeout_milliseconds:=120000
  ) as request_id;
  $$
);
