-- Aggiorna il cron job per fetch-news a ogni 10 minuti
-- Questo garantisce:
-- 1. Articoli sul sito web quasi in tempo reale (entro 10 min)
-- 2. Spaziatura perfetta su X (massimo 1 tweet ogni >= 20 minuti senza raffiche)
SELECT cron.unschedule('invoke-fetch-news') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invoke-fetch-news');

SELECT cron.schedule(
  'invoke-fetch-news',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
      url:='https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/fetch-news',
      headers:='{"Content-Type": "application/json"}'::jsonb
  ) as request_id;
  $$
);
