-- Aggiorna la schedulazione del crawler fetch-news a ogni 15 minuti
-- Intervallo ottimizzato: tempestività per le breaking news e consumo risorse ideale

-- Rimuovi vecchi cron duplicati
SELECT cron.unschedule('fetch-news-every-hour') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fetch-news-every-hour');
SELECT cron.unschedule('invoke-fetch-news') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invoke-fetch-news');

SELECT cron.schedule(
  'invoke-fetch-news',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
      url:='https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/fetch-news',
      headers:='{"Content-Type": "application/json"}'::jsonb
  ) as request_id;
  $$
);
