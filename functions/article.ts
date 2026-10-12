const SUPABASE_URL = "https://kkjxmjbuzgarxllbzkil.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtranhtamJ1emdhcnhsbGJ6a2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDcxNDQsImV4cCI6MjEwNjAyMzE0NH0.GahiUgIxEJf_KZ5bC7hTXdUr6o67VOLUcCollg8wKgM";

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const articleId = url.searchParams.get("id");

  const response = await context.next();
  if (!articleId) {
    return response;
  }

  try {
    const sbUrl = env?.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
    const sbKey = env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

    const apiRes = await fetch(
      `${sbUrl}/rest/v1/articles?id=eq.${encodeURIComponent(
        articleId
      )}&select=id,title,published_at,image_url,original_url,ai_summary`,
      {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      }
    );

    if (!apiRes.ok) {
      return response;
    }

    const rows = await apiRes.json();
    const article = rows?.[0];
    if (!article) {
      return response;
    }

    const title = article.title || "RomaFlash | Notizia AS Roma";
    const excerpt =
      article.ai_summary?.excerpt ||
      "Notizie sull'AS Roma riassunte dall'AI su RomaFlash.";
    const content = article.ai_summary?.content || excerpt;
    const category = article.ai_summary?.category || "AS Roma";
    const publishedAt = article.published_at || new Date().toISOString();
    const canonicalUrl = `https://romaflash.app/article?id=${article.id}`;

    // Resolve full absolute image URL for OpenGraph and X/Twitter Cards
    let ogImage = "https://romaflash.app/images/archive/roma-1.jpg";
    if (article.image_url) {
      ogImage = article.image_url.startsWith("/")
        ? `https://romaflash.app${article.image_url}`
        : article.image_url;
    } else if (article.ai_summary?.youtube_id) {
      ogImage = `https://img.youtube.com/vi/${article.ai_summary.youtube_id}/hqdefault.jpg`;
    } else if (
      article.original_url?.startsWith("romaflash-daily-briefing") ||
      category === "Il Punto della Giornata"
    ) {
      ogImage = "https://romaflash.app/images/daily-briefing/briefing-1.jpg";
    }

    const jsonLd = {
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
        "@id": canonicalUrl,
      },
      image: [ogImage],
      author: {
        "@type": "Organization",
        name: "RomaFlash",
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

    const safeTitle = escapeHtml(`${title} | RomaFlash`);
    const safeOgTitle = escapeHtml(title);
    const safeDesc = escapeHtml(excerpt);
    const safeContent = escapeHtml(content);
    const safeCategory = escapeHtml(category);
    const safeCanonical = escapeHtml(canonicalUrl);
    const safeOgImage = escapeHtml(ogImage);
    const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

    const extraHeadTags = `
      <link rel="canonical" href="${safeCanonical}" />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="RomaFlash" />
      <meta property="og:locale" content="it_IT" />
      <meta property="og:title" content="${safeOgTitle}" />
      <meta property="og:description" content="${safeDesc}" />
      <meta property="og:url" content="${safeCanonical}" />
      <meta property="og:image" content="${safeOgImage}" />
      <meta property="article:published_time" content="${escapeHtml(publishedAt)}" />
      <meta property="article:section" content="${safeCategory}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${safeOgTitle}" />
      <meta name="twitter:description" content="${safeDesc}" />
      <meta name="twitter:image" content="${safeOgImage}" />
      <script type="application/ld+json">${safeJsonLd}</script>
    `;

    // @ts-ignore - HTMLRewriter is available natively in Cloudflare Workers / Pages runtime
    return new HTMLRewriter()
      .on("title", {
        element(el: any) {
          el.setInnerContent(safeTitle, { html: true });
        },
      })
      .on('meta[name="description"]', {
        element(el: any) {
          el.setAttribute("content", excerpt);
        },
      })
      .on('link[rel="canonical"], meta[property^="og:"], meta[name^="twitter:"]', {
        element(el: any) {
          el.remove();
        },
      })
      .on("head", {
        element(el: any) {
          el.append(extraHeadTags, { html: true });
        },
      })
      .on("body", {
        element(el: any) {
          el.append(
            `<noscript><article><h1>${safeOgTitle}</h1><p>${safeDesc}</p><div>${safeContent}</div></article></noscript>`,
            { html: true }
          );
        },
      })
      .transform(response);
  } catch {
    return response;
  }
}
