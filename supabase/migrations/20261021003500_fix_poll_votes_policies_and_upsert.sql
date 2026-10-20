-- Consenti all'utente di aggiornare o cancellare il proprio voto sul sondaggio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'poll_votes' AND policyname = 'Permetti aggiornamento voti'
  ) THEN
    CREATE POLICY "Permetti aggiornamento voti" ON public.poll_votes
      FOR UPDATE USING (auth.role() = ANY (ARRAY['anon'::text, 'authenticated'::text]))
      WITH CHECK (auth.role() = ANY (ARRAY['anon'::text, 'authenticated'::text]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'poll_votes' AND policyname = 'Permetti cancellazione voti'
  ) THEN
    CREATE POLICY "Permetti cancellazione voti" ON public.poll_votes
      FOR DELETE USING (auth.role() = ANY (ARRAY['anon'::text, 'authenticated'::text]));
  END IF;
END $$;

-- Pulisci il voto di test ID 48 rimasto bloccato durante le prove
DELETE FROM public.poll_votes WHERE id = 48;
