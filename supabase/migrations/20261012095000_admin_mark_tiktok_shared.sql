-- Protected RPC to allow marking/unmarking an article as shared on TikTok from /stats
CREATE OR REPLACE FUNCTION public.admin_set_tiktok_shared(target_article_id uuid, admin_pin text, is_shared boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF admin_pin <> '1927' THEN
    RAISE EXCEPTION 'PIN non valido';
  END IF;
  UPDATE public.articles
  SET ai_summary = jsonb_set(COALESCE(ai_summary, '{}'::jsonb), '{tiktok_shared}', to_jsonb(is_shared), true)
  WHERE id = target_article_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_tiktok_shared(uuid, text, boolean) TO anon, authenticated;
