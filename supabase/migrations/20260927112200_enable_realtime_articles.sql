-- Abilita il realtime sulla tabella articles
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE articles;
EXCEPTION WHEN OTHERS THEN
  -- Probabilmente era già aggiunta
  NULL;
END $$;
