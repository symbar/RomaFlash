-- 1. Creiamo la tabella per salvare le probabili formazioni
CREATE TABLE IF NOT EXISTS public.lineups (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    team TEXT UNIQUE NOT NULL,
    match_name TEXT NOT NULL,
    formation TEXT,
    starters JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permettiamo al frontend di leggere la tabella senza autenticazione (se desiderato)
ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lineups are publicly viewable" 
ON public.lineups FOR SELECT 
USING (true);

-- 2. Configurazione del Cron Job nativo (pg_cron)
-- Questo richiede che l'estensione pg_cron sia attivata nel tuo progetto Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Scheduliamo la chiamata alla nostra Edge Function ogni ora (minuto 0 di ogni ora)
-- Sostituisci [PROJECT_REF] con il tuo vero ID di progetto e inserisci la tua ANON KEY
SELECT cron.schedule(
  'update-lineups-every-hour',
  '0 * * * *', -- Esegue al minuto 0 di ogni ora
  $$
    SELECT net.http_post(
        url:='https://[PROJECT_REF].supabase.co/functions/v1/scrape-lineups',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer [YOUR_ANON_KEY]"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
