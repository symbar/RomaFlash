INSERT INTO articles (source_id, title, original_url, ai_summary)
VALUES (
  (SELECT id FROM sources LIMIT 1),
  'TEST FORMAZIONE: Roma - Juventus, le scelte di De Rossi',
  'https://romaflash-test-formazione.com',
  '{
    "excerpt": "Ecco le probabili formazioni per il big match di questa sera all''Olimpico. De Rossi conferma il tridente delle meraviglie.",
    "content": "L''attesa è finita. Questa sera alle 20:45 la Roma scenderà in campo contro la Juventus per un match fondamentale per la rincorsa alla Champions League.\n\nDaniele De Rossi ha sciolto gli ultimi dubbi di formazione. In porta confermatissimo Svilar. La linea a quattro di difesa vedrà Celik a destra e Angelino a sinistra, con la coppia centrale formata da Mancini e Ndicka.\n\nA centrocampo torna dal primo minuto Paredes in cabina di regia, affiancato dall''inesauribile Cristante e dalla qualità del capitano Lorenzo Pellegrini.\n\nIn attacco, spazio al tridente pesante: Dybala agirà sulla trequarti con libertà d''inventare, dietro al centravanti ucraino Dovbyk, supportato dalle incursioni di El Shaarawy a sinistra.\n\nUna Roma a trazione anteriore per cercare di scardinare la solida difesa bianconera.",
    "category": "Probabili Formazioni",
    "sentiment": "Positivo",
    "formation": {
      "modulo": "4-3-3",
      "portiere": ["Svilar"],
      "difensori": ["Celik", "Mancini", "Ndicka", "Angelino"],
      "centrocampisti": ["Cristante", "Paredes", "Pellegrini"],
      "attaccanti": ["Dybala", "Dovbyk", "El Shaarawy"]
    }
  }'::jsonb
);
