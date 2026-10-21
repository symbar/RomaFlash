-- Aggiorna la schedulazione del crawler fetch-news a ogni 15 minuti (Opzione B)
-- Intervallo ottimizzato: massimo 3 articoli a giro ogni 15 minuti (max 288 chiamate/giorno su 500 RPD disponibili)

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
