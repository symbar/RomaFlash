-- Schedule the daily-briefing Edge Function to run every evening at 20:30 UTC
select cron.schedule(
  'invoke-daily-briefing',
  '30 20 * * *', 
  
  select net.http_post(
      url:='https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/daily-briefing',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
      body:='{}'::jsonb
  ) as request_id;
  
);
