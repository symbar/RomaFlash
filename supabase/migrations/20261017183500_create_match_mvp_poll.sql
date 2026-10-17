-- 1. Create table for Matchday MVP Polls
CREATE TABLE IF NOT EXISTS public.match_mvp_polls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_title text NOT NULL,
  match_score text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('scheduled', 'active', 'closed')),
  started_at timestamptz DEFAULT now(),
  closes_at timestamptz DEFAULT (now() + interval '4 hours'),
  candidates jsonb NOT NULL,
  total_votes int DEFAULT 0,
  winner_slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create table for individual votes (with anti-duplicate device constraint)
CREATE TABLE IF NOT EXISTS public.match_mvp_votes (
  id serial PRIMARY KEY,
  poll_id uuid NOT NULL REFERENCES public.match_mvp_polls(id) ON DELETE CASCADE,
  player_slug text NOT NULL,
  voter_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_poll_voter UNIQUE (poll_id, voter_token)
);

CREATE INDEX IF NOT EXISTS idx_mvp_votes_poll_id ON public.match_mvp_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_mvp_polls_status ON public.match_mvp_polls(status);

-- 3. Enable RLS
ALTER TABLE public.match_mvp_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_mvp_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can select mvp polls"
  ON public.match_mvp_polls FOR SELECT
  USING (true);

CREATE POLICY "Public can select mvp votes"
  ON public.match_mvp_votes FOR SELECT
  USING (true);

CREATE POLICY "Public can insert mvp votes"
  ON public.match_mvp_votes FOR INSERT
  WITH CHECK (true);

-- 4. Atomic Vote Function with Live Tally & Percentage Breakdown
CREATE OR REPLACE FUNCTION public.cast_mvp_vote(
  target_poll_id uuid,
  target_player_slug text,
  target_voter_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  poll_record record;
  existing_vote record;
  votes_summary jsonb;
  total_count int;
  top_slug text;
BEGIN
  -- Check if poll exists and is active
  SELECT * INTO poll_record
  FROM public.match_mvp_polls
  WHERE id = target_poll_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Poll non trovato');
  END IF;

  IF poll_record.status = 'closed' OR now() > poll_record.closes_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sondaggio chiuso');
  END IF;

  -- Check if voter already voted
  SELECT * INTO existing_vote
  FROM public.match_mvp_votes
  WHERE poll_id = target_poll_id AND voter_token = target_voter_token;

  IF FOUND THEN
    -- If already voted, don't re-insert, just return current stats
    NULL;
  ELSE
    -- Insert new vote
    INSERT INTO public.match_mvp_votes (poll_id, player_slug, voter_token)
    VALUES (target_poll_id, target_player_slug, target_voter_token);

    -- Increment total votes
    UPDATE public.match_mvp_polls
    SET total_votes = total_votes + 1,
        updated_at = now()
    WHERE id = target_poll_id;
  END IF;

  -- Calculate summary breakdown per candidate
  SELECT 
    COUNT(*)::int,
    jsonb_object_agg(player_slug, cnt)
  INTO total_count, votes_summary
  FROM (
    SELECT player_slug, COUNT(*)::int as cnt
    FROM public.match_mvp_votes
    WHERE poll_id = target_poll_id
    GROUP BY player_slug
  ) s;

  -- Determine top voted player
  SELECT player_slug INTO top_slug
  FROM public.match_mvp_votes
  WHERE poll_id = target_poll_id
  GROUP BY player_slug
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'success', true,
    'total_votes', COALESCE(total_count, 0),
    'votes_by_player', COALESCE(votes_summary, '{}'::jsonb),
    'top_slug', top_slug
  );
END;
$$;

-- 5. Read Poll Stats Function
CREATE OR REPLACE FUNCTION public.get_mvp_poll_stats(target_poll_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  poll_record record;
  votes_summary jsonb;
  total_count int;
  top_slug text;
BEGIN
  SELECT * INTO poll_record
  FROM public.match_mvp_polls
  WHERE id = target_poll_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Poll non trovato');
  END IF;

  SELECT 
    COUNT(*)::int,
    jsonb_object_agg(player_slug, cnt)
  INTO total_count, votes_summary
  FROM (
    SELECT player_slug, COUNT(*)::int as cnt
    FROM public.match_mvp_votes
    WHERE poll_id = target_poll_id
    GROUP BY player_slug
  ) s;

  SELECT player_slug INTO top_slug
  FROM public.match_mvp_votes
  WHERE poll_id = target_poll_id
  GROUP BY player_slug
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'success', true,
    'poll', row_to_json(poll_record),
    'total_votes', COALESCE(total_count, 0),
    'votes_by_player', COALESCE(votes_summary, '{}'::jsonb),
    'top_slug', top_slug
  );
END;
$$;
