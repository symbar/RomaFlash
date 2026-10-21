-- Aggiorna la schedulazione del crawler fetch-news a ogni 30 minuti
-- Intervallo ottimizzato: massimo 2 articoli a giro ogni 30 minuti per rimanere ampiamente dentro il limite RPD (500/day) di Gemini Free

SELECT cron.unschedule('invoke-fetch-news') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invoke-fetch-news');

SELECT cron.schedule(
  'invoke-fetch-news',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
      url:='https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/fetch-news',
      headers:='{"Content-Type": "application/json"}'::jsonb
  ) as request_id;
  $$
);
