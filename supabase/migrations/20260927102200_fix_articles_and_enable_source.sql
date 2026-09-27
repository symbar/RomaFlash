-- 1. Pulisci gli articoli buggati senza riassunto
DELETE FROM articles WHERE ai_summary->>'excerpt' = 'Riassunto non disponibile.';
DELETE FROM articles WHERE ai_summary->>'excerpt' IS NULL;

-- 2. Attiva la fonte VoceGiallorossa
UPDATE sources SET is_active = true WHERE name = 'VoceGiallorossa';
