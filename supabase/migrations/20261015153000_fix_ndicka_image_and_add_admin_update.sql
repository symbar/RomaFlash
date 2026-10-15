-- 1. Fix image for Ndicka article 7d54711a-afe6-406f-9b19-a1fb37074a3d with the real match photo from source
UPDATE public.articles
SET image_url = 'https://net-storage-auto.tcccdn.com/storage/vocegiallorossa.it/img_notizie/thumb3/f7/f7df2476c9aba5a63ded6aa4fcbd9a8e-69874-oooz0000.jpeg'
WHERE id = '7d54711a-afe6-406f-9b19-a1fb37074a3d';

-- 2. General admin RPC to update article image with admin PIN protection
CREATE OR REPLACE FUNCTION public.admin_update_article_image(target_article_id uuid, admin_pin text, new_image_url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF admin_pin <> '1927' THEN
    RAISE EXCEPTION 'PIN non valido';
  END IF;
  UPDATE public.articles
  SET image_url = new_image_url
  WHERE id = target_article_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_article_image(uuid, text, text) TO anon, authenticated;
