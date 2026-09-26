create extension if not exists pg_cron;
create extension if not exists pg_net;
select
  cron.schedule(
    'fetch-news-every-hour',
    '0 * * * *',
    $$
    select
      net.http_post(
          url:='https://kkjxmjbuzgarxllbzkil.supabase.co/functions/v1/fetch-news',
          headers:='{"Content-Type": "application/json"}'::jsonb,
          timeout_milliseconds:=300000
      ) as request_id;
    $$
  );
