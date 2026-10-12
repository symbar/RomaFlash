-- Replace source-branded graphics/watermarked images and backfill missing images with RomaFlash's 10 custom archive images
UPDATE public.articles
SET image_url = '/images/archive/roma-7.jpg'
WHERE id = '2e3f2c20-61ca-484d-8f5d-f48731f499f9';

UPDATE public.articles
SET image_url = '/images/archive/roma-4.jpg'
WHERE id = 'e537e536-e5d5-4bdf-b31d-063301b598b6';

UPDATE public.articles
SET image_url = '/images/archive/roma-2.jpg'
WHERE id = 'e06cd659-2a39-459b-8721-daa5d9aaed89';

UPDATE public.articles
SET image_url = '/images/archive/roma-8.jpg'
WHERE id = '55ece1ab-9485-45f2-b604-b34806a2aefc';

UPDATE public.articles
SET image_url = '/images/archive/roma-8.jpg'
WHERE id = 'dac18d8d-10b0-4d79-b422-101cbcbf63e6';

UPDATE public.articles
SET image_url = '/images/archive/roma-5.jpg'
WHERE id = 'ac173bc4-b6cc-4097-bb3e-b410d5756ec4';

UPDATE public.articles
SET image_url = '/images/archive/roma-9.jpg'
WHERE id = 'c3437e96-c4a5-4db4-b616-e8317a429923';

UPDATE public.articles
SET image_url = '/images/archive/roma-10.jpg'
WHERE id = '104ef6fd-8726-441c-8b89-883275449a28';

UPDATE public.articles
SET image_url = '/images/archive/roma-6.jpg'
WHERE id = 'e1a15d76-40b1-4fa5-b1b1-b3ee8b26781b';
