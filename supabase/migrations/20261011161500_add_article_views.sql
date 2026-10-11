-- 1. Add views counter column to articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- 2. Atomic RPC to increment view count by 1
CREATE OR REPLACE FUNCTION public.increment_article_view(target_article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.articles
  SET views = COALESCE(views, 0) + 1
  WHERE id = target_article_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_article_view(uuid) TO anon, authenticated;

-- 3. Protected RPC to allow admin deletion of an article from /stats
CREATE OR REPLACE FUNCTION public.admin_delete_article(target_article_id uuid, admin_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF admin_pin <> '1927' THEN
    RAISE EXCEPTION 'PIN non valido';
  END IF;
  DELETE FROM public.poll_votes WHERE article_id = target_article_id;
  DELETE FROM public.articles WHERE id = target_article_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_article(uuid, text) TO anon, authenticated;
