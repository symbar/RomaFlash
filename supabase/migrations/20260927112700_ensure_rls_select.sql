-- Abilita RLS in caso non fosse abilitato e aggiunge policy di lettura
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Permetti lettura a tutti" 
  ON articles FOR SELECT 
  USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
