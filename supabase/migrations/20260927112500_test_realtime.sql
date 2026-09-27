INSERT INTO articles (source_id, title, original_url, ai_summary)
VALUES (
  (SELECT id FROM sources LIMIT 1),
  'LIVE TEST: La probabile formazione contro il Milan',
  'https://romaflash-test-realtime.com',
  '{
    "excerpt": "Le ultimissime da Trigoria in vista del super posticipo domenicale. Nuovi cambi sulle fasce.",
    "content": "Ultima rifinitura a Trigoria prima della partenza per Milano. De Rossi ha provato nuove soluzioni tattiche per sorprendere i rossoneri.\n\nDavanti a Svilar, la difesa vedrà il rientro di Mancini dal primo minuto, affiancato da Ndicka. Sulle fasce confermati Celik e Angelino.\n\nA centrocampo si ricompone il terzetto titolare: Paredes in regia con Cristante e Pellegrini ai suoi lati.\n\nIn attacco, ballottaggio sciolto: Dybala e El Shaarawy supporteranno l''unica punta Dovbyk.",
    "category": "Probabili Formazioni",
    "sentiment": "Neutro",
    "formation": {
      "modulo": "4-3-3",
      "portiere": ["Svilar"],
      "difensori": ["Celik", "Mancini", "Ndicka", "Angelino"],
      "centrocampisti": ["Cristante", "Paredes", "Pellegrini"],
      "attaccanti": ["Dybala", "Dovbyk", "El Shaarawy"]
    }
  }'::jsonb
);
