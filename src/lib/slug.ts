/**
 * Genera uno slug SEO-friendly per un articolo dato il titolo e l'UUID.
 * Esempio: "Ndicka social: 'Vicini a una serata speciale'" + "7d54711a-..."
 * -> "ndicka-social-vicini-a-una-serata-speciale-7d54711a-afe6-406f-9b19-a1fb37074a3d"
 */
export function generateArticleSlug(title: string, id: string): string {
  const cleanTitle = (title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Rimuove accenti (è -> e, à -> a)
    .replace(/[^a-z0-9]+/g, "-") // Sostituisce caratteri non alfanumerici con -
    .replace(/^-+|-+$/g, "") // Rimuove - all'inizio e alla fine
    .slice(0, 75); // Limita lunghezza

  return cleanTitle ? `${cleanTitle}-${id}` : id;
}

/**
 * Estrae l'UUID di 36 caratteri da uno slug o da una stringa URL.
 */
export function extractArticleIdFromSlug(slugOrPath: string): string | null {
  if (!slugOrPath) return null;
  const uuidMatch = slugOrPath.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  return uuidMatch ? uuidMatch[0] : null;
}

/**
 * Ritorna l'URL assoluto canonico SEO per un articolo.
 */
export function getArticleUrl(article: { title?: string; id: string }): string {
  if (!article?.id) return "https://romaflash.app";
  const slug = generateArticleSlug(article.title || "", article.id);
  return `https://romaflash.app/notizie/${slug}`;
}
