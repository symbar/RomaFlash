"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalRightSidebar from '@/components/GlobalRightSidebar';
import { ArrowLeft, Clock, Flame, Snowflake, MessageCircle, Quote } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import ShareButton from '@/components/ShareButton';
import { Tweet } from 'react-tweet';
import PitchView from '@/components/PitchView';
import PollWidget from '@/components/PollWidget';
import ArticleReactions from '@/components/ArticleReactions';
import { useLanguage } from '@/components/LanguageContext';
import ArticleImage, { getArticleImageUrl } from '@/components/ArticleImage';
import { generateArticleSlug } from '@/lib/slug';
import MatchStatsWidget from '@/components/MatchStatsWidget';

function formatDate(dateString: string, lang: 'it' | 'en' = 'it') {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
  const locale = lang === 'en' ? 'en-GB' : 'it-IT';
  const timeString = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
  if (isToday) return timeString;
  const dayMonth = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return `${dayMonth} ${timeString}`;
}

function ArticleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang, t, getArticleTitle, getArticleExcerpt, getArticleContent, getArticlePoll, translateCategory } = useLanguage();
  const queryId = searchParams.get('id');
  const pathId = typeof window !== 'undefined'
    ? window.location.pathname.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] || null
    : null;
  const id = queryId || pathId;

  // Recupera i dati pre-renderizzati lato server da Cloudflare Edge SSR (idratazione istantanea)
  const initialEmbeddedArticle = (() => {
    if (typeof document === 'undefined') return null;
    try {
      const el = document.getElementById('__ROMAFLASH_ARTICLE_DATA__');
      if (el && el.textContent) {
        const parsed = JSON.parse(el.textContent);
        if (parsed && (!id || parsed.id === id)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return null;
  })();

  const [article, setArticle] = useState<any>(initialEmbeddedArticle);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(!initialEmbeddedArticle);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('romaflash_font_size');
      if (saved === 'normal' || saved === 'large' || saved === 'xlarge') {
        setFontSize(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const cycleFontSize = () => {
    const next =
      fontSize === 'normal'
        ? 'large'
        : fontSize === 'large'
          ? 'xlarge'
          : 'normal';
    setFontSize(next);
    try {
      localStorage.setItem('romaflash_font_size', next);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let viewTimer: NodeJS.Timeout | null = null;

    async function fetchArticle() {
      if (!id) return;

      let currentArticle = article;

      if (!currentArticle || currentArticle.id !== id) {
        const { data } = await supabase
          .from('articles')
          .select('*, sources(name)')
          .eq('id', id)
          .single();
        
        if (data) {
          currentArticle = data;
          setArticle(data);
        }
      }
      
      if (currentArticle) {
        // Tracciamento silenzioso di ogni lettura umana (filtro anti-bot + 2s di permanenza reale)
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
        const isBot =
          (typeof navigator !== 'undefined' && navigator.webdriver) ||
          /bot|crawl|spider|slurp|headless|lighthouse|pingdom|gtmetrix|facebookexternalhit|whatsapp|telegrambot|twitterbot|perplexity|gptbot|claudebot/i.test(ua);

        if (!isBot) {
          viewTimer = setTimeout(() => {
            supabase.rpc('increment_article_view', { target_article_id: currentArticle.id }).then(() => {});
          }, 2000);
        }
        
        if (currentArticle.ai_summary?.category) {
          const { data: recentData } = await supabase
            .from('articles')
            .select('id, title, published_at, ai_summary')
            .neq('id', currentArticle.id)
            .order('published_at', { ascending: false })
            .limit(20);
            
          if (recentData) {
            const related = recentData
              .filter(a => a.ai_summary?.category === currentArticle.ai_summary.category)
              .slice(0, 3);
            setRelatedArticles(related);
          }
        }
      }
      setLoading(false);
    }
    fetchArticle();

    return () => {
      if (viewTimer) clearTimeout(viewTimer);
    };
  }, [id]);

  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => setShowSkeleton(true), 300);
    } else {
      setShowSkeleton(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (article) {
      const currentTitle = getArticleTitle(article);
      if (currentTitle) {
        document.title = `${currentTitle} | RomaFlash`;
      }
    }
  }, [article, lang, getArticleTitle]);

  if (loading) {
    if (!showSkeleton) {
      return <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 lg:pb-12"></main>;
    }
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 lg:pb-12 animate-pulse">
        <div className="w-24 h-6 bg-gray-200 rounded mb-8"></div>
        <div className="w-3/4 h-10 bg-gray-300 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="w-full h-4 bg-gray-200 rounded"></div>
          <div className="w-full h-4 bg-gray-200 rounded"></div>
          <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 lg:pb-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('article.not_found')}</h1>
        <Link href="/" className="text-primary hover:underline">{t('article.back_home')}</Link>
      </main>
    );
  }

  const displayTitle = getArticleTitle(article);
  const displayExcerpt = getArticleExcerpt(article);
  const content = getArticleContent(article) || "Contenuto in elaborazione...";
  const displayPoll = getArticlePoll(article);
  const displayCategory = article.ai_summary?.category ? translateCategory(article.ai_summary.category) : '';

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: displayTitle,
    description: displayExcerpt,
    articleBody: content,
    articleSection: displayCategory || "AS Roma",
    datePublished: article.published_at,
    dateModified: article.published_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://romaflash.app/article?id=${article.id}`,
    },
    image: [
      article.ai_summary?.youtube_id
        ? `https://img.youtube.com/vi/${article.ai_summary.youtube_id}/hqdefault.jpg`
        : "https://romaflash.app/icon",
    ],
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

  const getSentimentBadge = (sentiment?: string) => {
    if (sentiment === 'Positivo') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/20">
          <Flame className="w-3 h-3" /> Hot
        </span>
      );
    }
    if (sentiment === 'Negativo') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Snowflake className="w-3 h-3" /> Cold
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-500/10 text-gray-500 border border-gray-500/20">
        <MessageCircle className="w-3 h-3" /> News
      </span>
    );
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 lg:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="bg-background">
        <GlobalHeader title="Notizia" />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1 lg:w-[65%] xl:w-[70%] order-2 lg:order-1 flex flex-col">
            <header className="py-4 mb-6 border-b border-border/50">
              <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-primary hover:opacity-80 font-semibold mb-6 transition-opacity cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
                {t('article.back')}
              </button>
              
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider mb-4">
                {displayCategory && (
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-primary">
                    {displayCategory}
                  </span>
                )}
                {article.ai_summary?.sentiment && getSentimentBadge(article.ai_summary.sentiment)}
                <div className="flex items-center gap-2 ml-auto text-gray-500">
                  <span className="flex items-center gap-1 mr-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(article.published_at, lang)}
                  </span>
                  <button
                    type="button"
                    onClick={cycleFontSize}
                    className={`px-2 py-1 rounded-lg text-xs font-extrabold tracking-tight transition-colors cursor-pointer select-none ${
                      fontSize === 'normal'
                        ? 'text-gray-500 hover:text-primary hover:bg-gray-100'
                        : 'bg-primary/10 text-primary'
                    }`}
                    title={
                      lang === 'it'
                        ? 'Dimensione testo (Normale / Grande / Extra Grande)'
                        : 'Text size (Normal / Large / Extra Large)'
                    }
                    aria-label="Regola dimensione testo"
                  >
                    {fontSize === 'normal' ? 'Aa' : fontSize === 'large' ? 'Aa+' : 'Aa++'}
                  </button>
                  <ShareButton 
                    title={displayTitle} 
                    text={displayExcerpt} 
                    url={`https://romaflash.app/notizie/${generateArticleSlug(article.title, article.id)}`} 
                  />
                </div>
              </div>

              <h1
                className={`font-serif font-bold leading-tight text-foreground mb-6 transition-all duration-150 ${
                  fontSize === 'xlarge'
                    ? 'text-[34px] md:text-[42px]'
                    : fontSize === 'large'
                      ? 'text-[32px] md:text-[40px]'
                      : 'text-3xl md:text-4xl'
                }`}
              >
                {displayTitle}
              </h1>

              {getArticleImageUrl(article) && !article.ai_summary?.youtube_id && (
                <ArticleImage src={getArticleImageUrl(article)} alt={displayTitle} variant="article" article={article} />
              )}
              
              {article.ai_summary?.youtube_id && (
                <a 
                  href={`https://www.youtube.com/watch?v=${article.ai_summary.youtube_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full aspect-video rounded-xl overflow-hidden shadow-lg mb-8 relative group border border-border bg-black"
                >
                  <img 
                    src={`https://img.youtube.com/vi/${article.ai_summary.youtube_id}/hqdefault.jpg`} 
                    alt={t('article.watch_youtube')}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                      <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded font-semibold backdrop-blur-sm">
                    {t('article.watch_youtube')}
                  </div>
                </a>
              )}
            </header>

            <article
              className={`leading-relaxed text-foreground transition-all duration-150 ${
                fontSize === 'xlarge'
                  ? 'text-xl md:text-2xl'
                  : fontSize === 'large'
                    ? 'text-lg md:text-xl'
                    : 'text-base md:text-lg'
              }`}
            >
              {(() => {
                const paragraphs = content.split('\n').filter((p: string) => p.trim() !== '');
                let embedUrl = (article.original_url && (article.original_url.includes('twitter.com') || article.original_url.includes('x.com'))) 
                  ? article.original_url 
                  : article.ai_summary?.social_embed_url;
                  
                let hasTweet = embedUrl && (embedUrl.includes('twitter.com') || embedUrl.includes('x.com'));
                let tweetId = hasTweet ? embedUrl.split('status/')[1]?.split('?')[0] : '';
                if (tweetId && !/^\d+$/.test(tweetId)) tweetId = '';

                const renderFormattedInline = (text: string) => {
                  if (!text) return null;
                  // Elimina qualsiasi asterisco residuo
                  return text.replace(/\*\*/g, '');
                };

                const renderParagraph = (p: string, key: string | number) => {
                  const trimmed = p.trim().replace(/\*\*/g, '');
                  if (!trimmed) return null;

                  const isBlockquote = trimmed.startsWith('>');
                  const isExplicitQuote = !isBlockquote && /^["“].+[”"]\s*[—–-]\s*.+$/.test(trimmed);

                  if (isBlockquote || isExplicitQuote) {
                    const cleanText = isBlockquote ? trimmed.replace(/^>\s*/, '') : trimmed;
                    let quoteText = cleanText;
                    let author = '';

                    const dashMatch = cleanText.match(/^(.*?)\s+[—–-]\s+([^—–-]+)$/);
                    if (dashMatch) {
                      quoteText = dashMatch[1].trim();
                      author = dashMatch[2].trim();
                    }

                    // Pulisci eventuali virgolette esterne doppie/singole
                    const unquotedText = quoteText.replace(/^["“](.*)["”]$/, '$1').trim();

                    return (
                      <blockquote
                        key={key}
                        className="quote-card my-8 rounded-2xl p-5 md:p-6 bg-gradient-to-br from-rose-50/70 via-amber-50/40 to-white dark:from-rose-950/20 dark:via-amber-950/10 dark:to-card border-l-4 border-[#8E1B23] shadow-xs relative overflow-hidden"
                      >
                        <Quote className="w-8 h-8 text-[#8E1B23]/15 absolute top-3 right-4 pointer-events-none" />
                        <div className="font-serif italic font-medium text-lg md:text-xl text-foreground leading-snug mb-3 pr-8">
                          &ldquo;{renderFormattedInline(unquotedText)}&rdquo;
                        </div>
                        {author && (
                          <div className="flex items-center gap-2 pt-2 border-t border-[#8E1B23]/10 text-xs text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-[#8E1B23] shrink-0"></span>
                            <span className="font-bold text-foreground">{author}</span>
                          </div>
                        )}
                      </blockquote>
                    );
                  }

                  if (trimmed.startsWith('#')) {
                    const headingText = trimmed.replace(/^#+\s*/, '');
                    return (
                      <h3 key={key} className="text-xl md:text-2xl font-bold font-serif text-foreground mt-8 mb-4">
                        {renderFormattedInline(headingText)}
                      </h3>
                    );
                  }

                  // Se il paragrafo inizia con un'intestazione editoriale tipo "La Chiave Tattica:" o "Il Verdetto dei Numeri:"
                  const sectionTitleMatch = trimmed.match(/^([A-ZÀ-Ú][\w\s'&’\/-]{2,35}:)\s*([\s\S]*)$/);
                  if (sectionTitleMatch) {
                    return (
                      <p key={key} className="mb-6 leading-relaxed">
                        <strong className="font-bold text-foreground">
                          {sectionTitleMatch[1]}{' '}
                        </strong>
                        {renderFormattedInline(sectionTitleMatch[2])}
                      </p>
                    );
                  }

                  return <p key={key} className="mb-6 leading-relaxed">{renderFormattedInline(trimmed)}</p>;
                };

                if (tweetId === '') hasTweet = false;

                // Rilevamento articolo de "L'Analista" per inserire la scheda statistiche
                const isAnalyst = article?.title?.toLowerCase().includes("l'analista") || article?.ai_summary?.category === "L'Analista";

                // Posiziona il widget statistiche esattamente tra "La Chiave Tattica" e "L'Impatto Statistico"
                let statsWidgetTargetIndex = -1;
                if (isAnalyst) {
                  // Cerca prima il paragrafo con "chiave tattica"
                  statsWidgetTargetIndex = paragraphs.findIndex((p: string) => 
                    p.toLowerCase().includes('chiave tattica') || p.toLowerCase().includes('tactical key')
                  );
                  // Se non trovato, cerca quello immediatamente precedente a "impatto statistico"
                  if (statsWidgetTargetIndex === -1) {
                    const impattoIdx = paragraphs.findIndex((p: string) =>
                      p.toLowerCase().includes('impatto statistico') || p.toLowerCase().includes('statistical impact')
                    );
                    if (impattoIdx > 0) {
                      statsWidgetTargetIndex = impattoIdx - 1;
                    } else {
                      // Fallback dopo il secondo paragrafo
                      statsWidgetTargetIndex = Math.min(1, paragraphs.length - 1);
                    }
                  }
                }

                const tweetIndex = hasTweet ? Math.floor(paragraphs.length / 2) : -1;

                return (
                  <>
                    {paragraphs.map((p: string, i: number) => (
                      <div key={i}>
                        {renderParagraph(p, i)}

                        {/* Widget Statistiche Match: posizionato subito dopo "La Chiave Tattica" (prima de "L'Impatto Statistico") */}
                        {isAnalyst && i === statsWidgetTargetIndex && (
                          <MatchStatsWidget article={article} />
                        )}

                        {hasTweet && i === tweetIndex && (
                          <div className="my-8 flex justify-center w-full">
                            <Tweet id={tweetId || ''} />
                          </div>
                        )}
                      </div>
                    ))}

                    {article.ai_summary?.formation && <PitchView formation={article.ai_summary.formation} />}
                  </>
                );
              })()}
            </article>

            {/* Reazioni Rapide con Emoji stile Facebook (Muro del Tifoso) */}
            <ArticleReactions articleId={article.id} />

            {displayPoll && (
              <PollWidget articleId={article.id} poll={displayPoll} />
            )}

            {relatedArticles.length > 0 && (
              <section className="mt-16 pt-8 border-t border-border/50">
                <h3 className="text-xl font-serif font-bold mb-6 text-foreground flex items-center gap-2">
                  {t('article.read_more')} <span className="text-sm font-sans font-normal text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{displayCategory}</span>
                </h3>
                <div className="space-y-4">
                  {relatedArticles.map((rel) => (
                    <Link 
                      key={rel.id} 
                      href={`/article?id=${rel.id}`}
                      className="block p-4 rounded-xl bg-white border border-border hover:bg-gray-50 transition-colors shadow-xs"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-base font-bold text-foreground leading-tight">
                          {getArticleTitle(rel)}
                        </h4>
                        {rel.ai_summary?.sentiment && getSentimentBadge(rel.ai_summary.sentiment)}
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rel.published_at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'it-IT', { day: 'numeric', month: 'short' })}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
          <GlobalRightSidebar />
        </div>
      </div>
    </main>
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center animate-pulse">Caricamento...</div>}>
      <ArticleContent />
    </Suspense>
  );
}
