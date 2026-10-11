-- 1. Add voter_token column to poll_votes to prevent duplicate votes per device/token
ALTER TABLE public.poll_votes ADD COLUMN IF NOT EXISTS voter_token text;

-- 2. Enforce at most 1 vote per (article_id, voter_token) at the database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_votes_unique_voter
  ON public.poll_votes (article_id, voter_token)
  WHERE voter_token IS NOT NULL;

-- 3. Ensure option_index is a valid option (0..5)
ALTER TABLE public.poll_votes
  DROP CONSTRAINT IF EXISTS chk_poll_votes_valid;

ALTER TABLE public.poll_votes
  ADD CONSTRAINT chk_poll_votes_valid
  CHECK (option_index >= 0 AND option_index <= 5);
