const SUPABASE_URL = "https://kkjxmjbuzgarxllbzkil.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtranhtamJ1emdhcnhsbGJ6a2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDcxNDQsImV4cCI6MjEwNjAyMzE0NH0.GahiUgIxEJf_KZ5bC7hTXdUr6o67VOLUcCollg8wKgM";

export async function onRequestGet(context: any) {
  const { env } = context;
  const sbUrl = env?.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const sbKey = env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

  let articles: Array<{ id: string; published_at: string }> = [];

  try {
    const res = await fetch(
      `${sbUrl}/rest/v1/articles?select=id,published_at&order=published_at.desc&limit=500`,
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
    // fallback to static routes only
  }

  const nowIso = new Date().toISOString();

  const staticUrls = [
    { loc: "https://romaflash.app/", changefreq: "always", priority: "1.0" },
    {
      loc: "https://romaflash.app/formazioni",
      changefreq: "hourly",
      priority: "0.9",
    },
    {
      loc: "https://romaflash.app/calendario",
      changefreq: "daily",
      priority: "0.8",
    },
    {
      loc: "https://romaflash.app/classifica",
      changefreq: "daily",
      priority: "0.8",
    },
  ];

  const staticXml = staticUrls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  const articlesXml = articles
    .map(
      (a) => `  <url>
    <loc>https://romaflash.app/article?id=${a.id}</loc>
    <lastmod>${new Date(a.published_at || nowIso).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${articlesXml}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}
