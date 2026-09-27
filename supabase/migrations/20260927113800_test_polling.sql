INSERT INTO articles (source_id, title, original_url, ai_summary)
VALUES (
  (SELECT id FROM sources LIMIT 1),
  'LIVE TEST V4: Polling funziona!',
  'https://romaflash-test-polling-v4.com',
  '{
    "excerpt": "Questo è un test per verificare se il polling HTTP fa apparire la pillola gialla.",
    "content": "Test superato! Ora la pillola fluttuante compare regolarmente.",
    "category": "Altro",
    "sentiment": "Positivo"
  }'::jsonb
);
