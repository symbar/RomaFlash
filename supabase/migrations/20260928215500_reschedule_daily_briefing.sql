-- Rimuovi la vecchia schedulazione
select cron.unschedule('invoke-daily-briefing');

-- Schedula "Il punto della giornata" alle 20:00 UTC (che corrispondono alle 22:00 in Italia durante l'ora legale, o 21:00 ora solare)
select cron.schedule(
  'invoke-daily-briefing',
  '0 20 * * *', 
  
  select net.http_post(
      url:='https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/daily-briefing',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
      body:='{}'::jsonb
  ) as request_id;
  
);
