"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalRightSidebar from '@/components/GlobalRightSidebar';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Clock, Flame, Snowflake, MessageCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import ShareButton from '@/components/ShareButton';
import { Tweet } from 'react-tweet';
import PitchView from '@/components/PitchView';
import PollWidget from '@/components/PollWidget';
import ArticleReactions from '@/components/ArticleReactions';
import { useLanguage } from '@/components/LanguageContext';
import ArticleImage, { getArticleImageUrl } from '@/components/ArticleImage';
import { motion, AnimatePresence } from 'framer-motion';

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
  const id = searchParams.get('id');
  const [article, setArticle] = useState<any>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const [prevArticle, setPrevArticle] = useState<any>(null);
  const [nextArticle, setNextArticle] = useState<any>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [swipeHint, setSwipeHint] = useState<'left' | 'right' | 'first' | 'last' | null>(null);
  const [touchOffset, setTouchOffset] = useState<number>(0);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingHorizontallyRef = useRef<boolean | null>(null);

  const navigateToArticle = (targetId: string, direction: 'left' | 'right') => {
    setSlideDirection(direction);
    setSwipeHint(null);
    setTouchOffset(0);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    router.push(`/article?id=${targetId}`);
  };

  // Navigazione da tastiera per desktop (Frecce Sinistra / Destra)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight' && nextArticle) {
        navigateToArticle(nextArticle.id, 'left');
      } else if (e.key === 'ArrowLeft' && prevArticle) {
        navigateToArticle(prevArticle.id, 'right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextArticle, prevArticle]);

  // Touch Swipe handlers per navigazione stile TikTok/Reels con pollice
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    isSwipingHorizontallyRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    if (isSwipingHorizontallyRef.current === null) {
      // Se lo scroll verticale è predominante, lascia il controllo allo scorrimento nativo
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) >= Math.abs(deltaX)) {
        isSwipingHorizontallyRef.current = false;
        setTouchOffset(0);
        setSwipeHint(null);
        return;
      }
      // Se il movimento orizzontale è netto, attiva la modalità swipe
      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isSwipingHorizontallyRef.current = true;
      }
    }

    if (isSwipingHorizontallyRef.current) {
      // Resistenza elastica stile iOS / TikTok
      const dampedX = deltaX * 0.35;
      setTouchOffset(dampedX);

      if (deltaX < -25) {
        setSwipeHint(nextArticle ? 'left' : 'last');
      } else if (deltaX > 25) {
        setSwipeHint(prevArticle ? 'right' : 'first');
      } else {
        setSwipeHint(null);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaTime = Date.now() - touchStartRef.current.time;

    if (isSwipingHorizontallyRef.current) {
      const isQuickSwipe = Math.abs(deltaX) > 40 && deltaTime < 350;
      const isLongSwipe = Math.abs(deltaX) > 70;

      if (isQuickSwipe || isLongSwipe) {
        if (deltaX < 0 && nextArticle) {
          // Swipe verso sinistra -> Notizia successiva
          navigateToArticle(nextArticle.id, 'left');
        } else if (deltaX > 0 && prevArticle) {
          // Swipe verso destra -> Notizia precedente
          navigateToArticle(prevArticle.id, 'right');
        }
      }
    }

    touchStartRef.current = null;
    isSwipingHorizontallyRef.current = null;
    setTouchOffset(0);
    setSwipeHint(null);
  };

  useEffect(() => {
    let viewTimer: NodeJS.Timeout | null = null;

    async function fetchArticle() {
      if (!id) return;
      setLoading(true);
      const { data } = await supabase
        .from('articles')
        .select('*, sources(name)')
        .eq('id', id)
        .single();
      
      if (data) {
        setArticle(data);

        // Fetch asincrono degli articoli adiacenti per navigazione swipe istantanea
        const [{ data: pData }, { data: nData }] = await Promise.all([
          supabase
            .from('articles')
            .select('id, title, published_at, ai_summary')
            .gt('published_at', data.published_at)
            .order('published_at', { ascending: true })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('articles')
            .select('id, title, published_at, ai_summary')
            .lt('published_at', data.published_at)
            .order('published_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (pData) {
          setPrevArticle(pData);
          router.prefetch(`/article?id=${pData.id}`);
        } else {
          setPrevArticle(null);
        }

        if (nData) {
          setNextArticle(nData);
          router.prefetch(`/article?id=${nData.id}`);
        } else {
          setNextArticle(null);
        }

        // Tracciamento silenzioso di ogni lettura umana (filtro anti-bot + 2s di permanenza reale)
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
        const isBot =
          (typeof navigator !== 'undefined' && navigator.webdriver) ||
          /bot|crawl|spider|slurp|headless|lighthouse|pingdom|gtmetrix|facebookexternalhit|whatsapp|telegrambot|twitterbot|perplexity|gptbot|claudebot/i.test(ua);

        if (!isBot) {
          viewTimer = setTimeout(() => {
            supabase.rpc('increment_article_view', { target_article_id: data.id }).then(() => {});
          }, 2000);
        }
        
        if (data.ai_summary?.category) {
          const { data: recentData } = await supabase
            .from('articles')
            .select('id, title, published_at, ai_summary')
            .neq('id', data.id)
            .order('published_at', { ascending: false })
            .limit(20);
            
          if (recentData) {
            const related = recentData
              .filter(a => a.ai_summary?.category === data.ai_summary.category)
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
          <motion.div
            key={article.id}
            initial={{ opacity: 0, x: slideDirection === 'left' ? 50 : slideDirection === 'right' ? -50 : 0 }}
            animate={{ opacity: 1, x: touchOffset }}
            transition={{
              x: { type: 'spring', damping: 28, stiffness: 320 },
              opacity: { duration: 0.18 }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex-1 lg:w-[65%] xl:w-[70%] order-2 lg:order-1 flex flex-col relative"
          >
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
                    url={`https://romaflash.app/article?id=${article.id}`} 
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
                
                if (tweetId === '') hasTweet = false;
                if (!hasTweet || paragraphs.length < 2) {
                  return (
                    <>
                      {paragraphs.map((p: string, i: number) => <p key={i} className="mb-6">{p}</p>)}
                      {hasTweet && (
                        <div className="my-8 flex justify-center w-full">
                          <Tweet id={tweetId || ''} />
                        </div>
                      )}
                      {article.ai_summary?.formation && <PitchView formation={article.ai_summary.formation} />}
                    </>
                  );
                }

                const midPoint = Math.ceil(paragraphs.length / 2);
                const firstHalf = paragraphs.slice(0, midPoint);
                const secondHalf = paragraphs.slice(midPoint);

                return (
                  <>
                    {firstHalf.map((p: string, i: number) => <p key={'f'+i} className="mb-6">{p}</p>)}
                    
                    <div className="my-8 flex justify-center w-full">
                      <Tweet id={tweetId || ''} />
                    </div>
                    
                    {secondHalf.map((p: string, i: number) => <p key={'s'+i} className="mb-6">{p}</p>)}
                    
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

            {/* Navigazione Orizzontale tra Articoli (Stile TikTok/Reels con Swipe) */}
            <nav className="mt-8 mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 border border-border shadow-xs" aria-label="Navigazione articoli">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                {prevArticle ? (
                  <button
                    type="button"
                    onClick={() => navigateToArticle(prevArticle.id, 'right')}
                    className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-white border border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group cursor-pointer shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-primary group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                        {t('article.prev')}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate block group-hover:text-primary transition-colors">
                        {getArticleTitle(prevArticle)}
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="flex-1 p-3 rounded-xl bg-gray-50/70 border border-dashed border-gray-200 text-center text-xs text-gray-400 font-medium">
                    {t('article.latest_news_alert')}
                  </div>
                )}

                {nextArticle ? (
                  <button
                    type="button"
                    onClick={() => navigateToArticle(nextArticle.id, 'left')}
                    className="flex-1 flex items-center justify-end gap-2.5 p-3 rounded-xl bg-white border border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all text-right group cursor-pointer shadow-2xs"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                        {t('article.next')}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate block group-hover:text-primary transition-colors">
                        {getArticleTitle(nextArticle)}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-primary group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ) : (
                  <div className="flex-1 p-3 rounded-xl bg-gray-50/70 border border-dashed border-gray-200 text-center text-xs text-gray-400 font-medium">
                    {lang === 'it' ? 'Hai raggiunto l\'ultima notizia' : 'You reached the oldest news'}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400">
                <span className="text-amber-500">👈</span>
                <span>{t('article.swipe_hint')}</span>
                <span className="text-amber-500">👉</span>
              </div>
            </nav>

            {/* Visual Indicator durante lo Swipe col pollice */}
            <AnimatePresence>
              {swipeHint && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className={`fixed top-24 z-50 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 border pointer-events-none select-none ${
                    swipeHint === 'left'
                      ? 'right-6 bg-primary text-white border-primary/20'
                      : swipeHint === 'right'
                      ? 'left-6 bg-primary text-white border-primary/20'
                      : 'left-1/2 -translate-x-1/2 bg-gray-900/90 text-white border-white/20'
                  }`}
                >
                  {swipeHint === 'left' && (
                    <>
                      <span>{t('article.next')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                  {swipeHint === 'right' && (
                    <>
                      <ChevronLeft className="w-4 h-4" />
                      <span>{t('article.prev')}</span>
                    </>
                  )}
                  {swipeHint === 'first' && <span>{t('article.latest_news_alert')}</span>}
                  {swipeHint === 'last' && <span>{lang === 'it' ? 'Ultima notizia disponibile' : 'Oldest news reached'}</span>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Barra Fluttuante Mobile per Switch Immediato (sempre accessibile con il pollice) */}
            <div className="lg:hidden fixed bottom-18 left-1/2 -translate-x-1/2 z-40 bg-gray-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-white/15 flex items-center gap-2.5 text-xs font-semibold select-none">
              <button
                type="button"
                disabled={!prevArticle}
                onClick={() => prevArticle && navigateToArticle(prevArticle.id, 'right')}
                className={`flex items-center gap-1 py-1 px-1.5 rounded-full ${prevArticle ? 'hover:text-amber-400 active:scale-95 cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                aria-label={t('article.prev')}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[11px]">Prec</span>
              </button>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="text-[10px] text-gray-300 font-normal">Swipe 👈 👉</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <button
                type="button"
                disabled={!nextArticle}
                onClick={() => nextArticle && navigateToArticle(nextArticle.id, 'left')}
                className={`flex items-center gap-1 py-1 px-1.5 rounded-full ${nextArticle ? 'hover:text-amber-400 active:scale-95 cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                aria-label={t('article.next')}
              >
                <span className="text-[11px]">Succ</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

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
          </motion.div>
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
