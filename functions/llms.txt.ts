const SUPABASE_URL = "https://kkjxmjbuzgarxllbzkil.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtranhtamJ1emdhcnhsbGJ6a2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDcxNDQsImV4cCI6MjEwNjAyMzE0NH0.GahiUgIxEJf_KZ5bC7hTXdUr6o67VOLUcCollg8wKgM";

export async function onRequestGet(context: any) {
  const { env } = context;
  const sbUrl = env?.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const sbKey = env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

  let articles: any[] = [];
  try {
    const res = await fetch(
      `${sbUrl}/rest/v1/articles?select=id,title,published_at,ai_summary&order=published_at.desc&limit=25`,
      {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      }
    );
    if (res.ok) {
      articles = await res.json();
    }
  } catch {
    // ignore
  }

  const latestList = articles
    .map((a) => {
      const cat = a.ai_summary?.category || "News";
      const excerpt = a.ai_summary?.excerpt || "";
      const enTitle = a.ai_summary?.en?.title
        ? ` | EN: ${a.ai_summary.en.title}`
        : "";
      return `- [${a.title}](https://romaflash.app/article?id=${a.id}) [${cat}] (${a.published_at}): ${excerpt}${enTitle}`;
    })
    .join("\n");

  const body = `# RomaFlash — L'essenza delle notizie giallorosse

> RomaFlash (https://romaflash.app) è la piattaforma editoriale in tempo reale sull'AS Roma (Serie A, Coppe Europee, Calciomercato, Probabili Formazioni, Calendario e Classifica), disponibile in Italiano e Inglese.

## Sezioni Principali
- [Ultime Notizie AS Roma](https://romaflash.app/): Feed in tempo reale con riassunti editoriali, analisi sentiment e sondaggi per i tifosi.
- [Probabili Formazioni AS Roma](https://romaflash.app/formazioni): Campo tattico, percentuali di titolarità, ballottaggi, infortunati e squalificati aggiornati ogni ora.
- [Calendario e Risultati AS Roma](https://romaflash.app/calendario): Tutte le partite stagionali di Serie A e Coppe con date, orari e punteggi.
- [Classifica Serie A](https://romaflash.app/classifica): Classifica aggiornata con punti, partite giocate e differenza reti.
- [Sitemap XML](https://romaflash.app/sitemap.xml): Elenco completo e aggiornato di tutti gli articoli pubblicati.

## Ultime Notizie in Tempo Reale (Live Feed)
${latestList || "- Visita https://romaflash.app per le ultime notizie."}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
