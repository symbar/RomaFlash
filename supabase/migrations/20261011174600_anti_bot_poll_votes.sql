-- 1. Remove any duplicate (article_id, voter_token) rows before creating UNIQUE index
DELETE FROM public.poll_votes a
USING public.poll_votes b
WHERE a.id > b.id
  AND a.article_id = b.article_id
  AND a.voter_token = b.voter_token;

-- 2. Enforce at most 1 vote per (article_id, voter_token) at the database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_votes_unique_voter
  ON public.poll_votes (article_id, voter_token);

-- 3. Ensure option_index is a valid option (0..5) and voter_token is non-empty
ALTER TABLE public.poll_votes
  DROP CONSTRAINT IF EXISTS chk_poll_votes_valid;

ALTER TABLE public.poll_votes
  ADD CONSTRAINT chk_poll_votes_valid
  CHECK (option_index >= 0 AND option_index <= 5 AND char_length(voter_token) >= 5);
