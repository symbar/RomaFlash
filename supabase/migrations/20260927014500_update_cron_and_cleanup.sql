-- 1. Aggiorna il cron job per fetch-news a 30 minuti
select cron.schedule(
  'invoke-fetch-news',
  '*/30 * * * *',
  $$
  select net.http_post(
      url:='https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/fetch-news',
      headers:='{"Content-Type": "application/json"}'::jsonb
  ) as request_id;
  $$
);

-- 2. Crea un cron job notturno per la pulizia degli articoli (Data Retention)
-- Elimina tutti gli articoli più vecchi di 60 giorni, tranne i "Punti della Giornata"
select cron.schedule(
  'cleanup-old-articles',
  '0 3 * * *', -- Alle 3:00 di notte ogni giorno
  $$
  delete from articles 
  where published_at < (now() - interval '60 days')
  and original_url not like 'romaflash-daily-briefing-%';
  $$
);
