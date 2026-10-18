const SUPABASE_URL = "https://kkjxmjbuzgarxllbzkil.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtranhtamJ1emdhcnhsbGJ6a2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDcxNDQsImV4cCI6MjEwNjAyMzE0NH0.GahiUgIxEJf_KZ5bC7hTXdUr6o67VOLUcCollg8wKgM";

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function resolveFullImageUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "https://romaflash.app/icon";
  if (rawUrl.startsWith("/")) {
    return `https://romaflash.app${rawUrl}`;
  }
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&output=jpg`;
  }
  return "https://romaflash.app/icon";
}

export async function onRequestGet(context: any) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const articleId = url.searchParams.get("id");

  // Se non c'è ID, passa direttamente alla pagina statica Next.js
  if (!articleId) {
    return next();
  }

  const sbUrl = env?.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const sbKey = env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

  // Recupera la pagina HTML statica originale generata da Next.js
  let response: Response;
  try {
    response = await next();
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (response.status !== 200) {
    return response;
  }

  // Interroga Supabase per i dettagli completi dell'articolo
  let article: any = null;
  try {
    const res = await fetch(
      `${sbUrl}/rest/v1/articles?id=eq.${encodeURIComponent(articleId)}&select=*,sources(name)`,
      {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        article = data[0];
      }
    }
  } catch {
    // In caso di errore temporaneo verso Supabase, restituisci l'HTML statico standard
    return response;
  }

  if (!article) {
    return response;
  }

  const title = (article.title || "Notizia AS Roma").replace(/\*\*/g, "");
  const excerpt = (article.ai_summary?.excerpt || article.title || "").replace(/\*\*/g, "");
  const content = (article.ai_summary?.content || article.content || excerpt).replace(/\*\*/g, "");
  const imageUrl = resolveFullImageUrl(article.image_url);
  const publishedAt = article.published_at || new Date().toISOString();
  const category = article.ai_summary?.category || "AS Roma";
  const sourceName = article.sources?.name || "RomaFlash";
  const articleUrl = `https://romaflash.app/article?id=${article.id}`;

  const escapedTitle = escapeHtml(title);
  const escapedExcerpt = escapeHtml(excerpt);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: excerpt,
    articleBody: content,
    articleSection: category,
    datePublished: publishedAt,
    dateModified: publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    image: [imageUrl],
    author: {
      "@type": "Organization",
      name: sourceName,
      url: "https://romaflash.app",
    },
    publisher: {
      "@type": "Organization",
      name: "RomaFlash",
      url: "https://romaflash.app",
      logo: {
        "@type": "ImageObject",
        url: "https://romaflash.app/icon",
      },
    },
  };

  const paragraphs = content
    .split(/\n+/)
    .map((p: string) => `<p>${escapeHtml(p.trim())}</p>`)
    .join("\n");

  const seoSemanticBlock = `
<div id="romaflash-ssr-article" class="sr-only" aria-hidden="true" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">
  <article>
    <header>
      <h1>${escapedTitle}</h1>
      <time datetime="${publishedAt}">${publishedAt}</time>
      <span class="category">${escapeHtml(category)}</span>
      <span class="source">${escapeHtml(sourceName)}</span>
    </header>
    <div class="excerpt">${escapedExcerpt}</div>
    <div class="content">
      ${paragraphs}
    </div>
  </article>
</div>
`;

  let html = await response.text();

  // 1. Sostituisci il titolo del documento
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>${escapedTitle} | RomaFlash</title>`
  );

  // 2. Sostituisci meta description e canonical
  html = html.replace(
    /<meta name="description" content=".*?"\s*\/?>/i,
    `<meta name="description" content="${escapedExcerpt}">`
  );
  html = html.replace(
    /<link rel="canonical" href=".*?"\s*\/?>/i,
    `<link rel="canonical" href="${articleUrl}">`
  );

  // 3. Sostituisci OpenGraph
  html = html.replace(
    /<meta property="og:title" content=".*?"\s*\/?>/i,
    `<meta property="og:title" content="${escapedTitle}">`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?"\s*\/?>/i,
    `<meta property="og:description" content="${escapedExcerpt}">`
  );
  html = html.replace(
    /<meta property="og:image" content=".*?"\s*\/?>/i,
    `<meta property="og:image" content="${imageUrl}">`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?"\s*\/?>/i,
    `<meta property="og:url" content="${articleUrl}">`
  );
  html = html.replace(
    /<meta property="og:type" content=".*?"\s*\/?>/i,
    `<meta property="og:type" content="article">`
  );

  // 4. Sostituisci Twitter Cards
  html = html.replace(
    /<meta name="twitter:title" content=".*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapedTitle}">`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapedExcerpt}">`
  );
  html = html.replace(
    /<meta name="twitter:image" content=".*?"\s*\/?>/i,
    `<meta name="twitter:image" content="${imageUrl}">`
  );
  html = html.replace(
    /<meta name="twitter:card" content=".*?"\s*\/?>/i,
    `<meta name="twitter:card" content="summary_large_image">`
  );

  // 5. Inietta JSON-LD e payload dati idratati prima di </head>
  const headInject = `
    <meta property="article:published_time" content="${publishedAt}">
    <meta property="article:section" content="${escapeHtml(category)}">
    <script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>
    <script id="__ROMAFLASH_ARTICLE_DATA__" type="application/json">${JSON.stringify(article).replace(/</g, "\\u003c")}</script>
  `;
  html = html.replace("</head>", `${headInject}\n</head>`);

  // 6. Inietta il blocco semantico SSR prima di </body>
  html = html.replace("</body>", `${seoSemanticBlock}\n</body>`);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
