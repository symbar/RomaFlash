-- Pulisci gli articoli di spam / annunci di lavoro
DELETE FROM articles WHERE title ILIKE '%Mettiti in gioco%' OR title ILIKE '%aspiranti giornalisti%';
