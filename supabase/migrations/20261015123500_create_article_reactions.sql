-- Create article_reactions table
CREATE TABLE IF NOT EXISTS public.article_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_token text NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_article_user_reaction UNIQUE(article_id, user_token)
);

CREATE INDEX IF NOT EXISTS idx_article_reactions_article_id ON public.article_reactions(article_id);

-- Enable RLS
ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can select article reactions"
  ON public.article_reactions FOR SELECT
  USING (true);

CREATE POLICY "Public can insert article reactions"
  ON public.article_reactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update article reactions"
  ON public.article_reactions FOR UPDATE
  USING (true);

CREATE POLICY "Public can delete article reactions"
  ON public.article_reactions FOR DELETE
  USING (true);

-- Atomic RPC to toggle reaction
CREATE OR REPLACE FUNCTION public.toggle_article_reaction(
  target_article_id uuid,
  target_user_token text,
  target_reaction_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_reaction text;
  result_user_reaction text;
  counts jsonb;
BEGIN
  -- Validate reaction type
  IF target_reaction_type NOT IN ('like', 'love', 'haha', 'wow', 'sad', 'angry') THEN
    RAISE EXCEPTION 'Tipo di reazione non valido';
  END IF;

  -- Check existing reaction for this user and article
  SELECT reaction_type INTO existing_reaction
  FROM public.article_reactions
  WHERE article_id = target_article_id AND user_token = target_user_token;

  IF existing_reaction IS NOT NULL THEN
    IF existing_reaction = target_reaction_type THEN
      -- Same reaction clicked: remove it (toggle off)
      DELETE FROM public.article_reactions
      WHERE article_id = target_article_id AND user_token = target_user_token;
      result_user_reaction := NULL;
    ELSE
      -- Different reaction clicked: update it
      UPDATE public.article_reactions
      SET reaction_type = target_reaction_type, updated_at = now()
      WHERE article_id = target_article_id AND user_token = target_user_token;
      result_user_reaction := target_reaction_type;
    END IF;
  ELSE
    -- No existing reaction: insert new
    INSERT INTO public.article_reactions (article_id, user_token, reaction_type)
    VALUES (target_article_id, target_user_token, target_reaction_type);
    result_user_reaction := target_reaction_type;
  END IF;

  -- Calculate summary counts
  SELECT jsonb_build_object(
    'total', count(*),
    'like', count(*) FILTER (WHERE reaction_type = 'like'),
    'love', count(*) FILTER (WHERE reaction_type = 'love'),
    'haha', count(*) FILTER (WHERE reaction_type = 'haha'),
    'wow', count(*) FILTER (WHERE reaction_type = 'wow'),
    'sad', count(*) FILTER (WHERE reaction_type = 'sad'),
    'angry', count(*) FILTER (WHERE reaction_type = 'angry')
  ) INTO counts
  FROM public.article_reactions
  WHERE article_id = target_article_id;

  RETURN jsonb_build_object(
    'user_reaction', result_user_reaction,
    'counts', counts
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_article_reaction(uuid, text, text) TO anon, authenticated;

-- Helper RPC to fetch reaction counts and user's current reaction
CREATE OR REPLACE FUNCTION public.get_article_reactions(
  target_article_id uuid,
  target_user_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_reaction text := NULL;
  counts jsonb;
BEGIN
  IF target_user_token IS NOT NULL THEN
    SELECT reaction_type INTO current_user_reaction
    FROM public.article_reactions
    WHERE article_id = target_article_id AND user_token = target_user_token;
  END IF;

  SELECT jsonb_build_object(
    'total', count(*),
    'like', count(*) FILTER (WHERE reaction_type = 'like'),
    'love', count(*) FILTER (WHERE reaction_type = 'love'),
    'haha', count(*) FILTER (WHERE reaction_type = 'haha'),
    'wow', count(*) FILTER (WHERE reaction_type = 'wow'),
    'sad', count(*) FILTER (WHERE reaction_type = 'sad'),
    'angry', count(*) FILTER (WHERE reaction_type = 'angry')
  ) INTO counts
  FROM public.article_reactions
  WHERE article_id = target_article_id;

  RETURN jsonb_build_object(
    'user_reaction', current_user_reaction,
    'counts', counts
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_article_reactions(uuid, text) TO anon, authenticated;

-- Add to Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'article_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.article_reactions;
  END IF;
END $$;
