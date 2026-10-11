"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Snowflake, MessageCircle, ArrowUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { WolfLogo } from '@/components/Icons';
import PullToRefresh from '@/components/PullToRefresh';
import ShareButton from '@/components/ShareButton';
import { motion } from 'framer-motion';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalRightSidebar from '@/components/GlobalRightSidebar';
import { useLanguage } from '@/components/LanguageContext';

function formatDate(dateString: string, lang: 'it' | 'en' = 'it') {
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
                  
  const locale = lang === 'en' ? 'en-GB' : 'it-IT';
  const timeString = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
  
  if (isToday) {
    return timeString;
  } else {
    const dayMonth = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    return `${dayMonth} ${timeString}`;
  }
}

let cachedArticles: any[] = [];
let cachedNextMatch: any | null = null;
let cachedCategoryFilter: string = 'Tutte';
let savedScrollPosition: number = 0;

export default function Home() {
  const router = useRouter();
  const { lang, t, getArticleTitle, getArticleExcerpt, translateCategory } = useLanguage();
  const [articles, setArticles] = useState<any[]>(cachedArticles);
  const [loading, setLoading] = useState(cachedArticles.length === 0);
  const [categoryFilter, setCategoryFilter] = useState(cachedCategoryFilter);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const PAGE_SIZE = 15;

  const fetchArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*, sources(name)')
      .order('published_at', { ascending: false })
      .range(0, PAGE_SIZE - 1);
    
    if (data) {
      setArticles(data);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  };

  const [nextMatch, setNextMatch] = useState<{home_team: string, away_team: string, competition: string, match_date: string} | null>(cachedNextMatch);

  const fetchNextMatch = async () => {
    const { data } = await supabase
      .from('next_match')
      .select('*')
      .limit(1)
      .maybeSingle();
      
    if (data) {
      setNextMatch(data);
    }
  };

  const loadMoreArticles = async () => {
    if (loadingMore || !hasMore || articles.length === 0) return;
    setLoadingMore(true);
    
    const currentLength = articles.length;
    const { data } = await supabase
      .from('articles')
      .select('*, sources(name)')
      .order('published_at', { ascending: false })
      .range(currentLength, currentLength + PAGE_SIZE - 1);
    
    if (data && data.length > 0) {
      setArticles(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (window.innerWidth < 1024 && entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreArticles();
        }
      },
      { rootMargin: '400px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, articles.length, categoryFilter]);

  const [newArticlesCount, setNewArticlesCount] = useState(0);

  useEffect(() => { cachedArticles = articles; }, [articles]);
  useEffect(() => { cachedCategoryFilter = categoryFilter; }, [categoryFilter]);
  useEffect(() => { cachedNextMatch = nextMatch; }, [nextMatch]);
  
  useEffect(() => {
    const handleScroll = () => {
      savedScrollPosition = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchNextMatch();

    const intervalId = setInterval(async () => {
      setArticles(currentArticles => {
        if (currentArticles.length === 0) return currentArticles;
        
        const latestLocalTime = currentArticles[0].published_at;
        
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .gt('published_at', latestLocalTime)
          .then(({ count }) => {
            if (count && count > 0) {
              setNewArticlesCount(count);
            }
          });
          
        return currentArticles;
      });
    }, 45000);

    return () => clearInterval(intervalId);
  }, []);

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
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-500/10 text-gray-600 border border-gray-500/20">
        <MessageCircle className="w-3 h-3" /> News
      </span>
    );
  };

  const categories = ['Tutte', 'Calciomercato', 'Partita', 'Infortunio', 'Dichiarazioni', 'Club', 'Social', 'Altro'];
  
  const filteredArticles = categoryFilter === 'Tutte' 
    ? articles 
    : articles.filter(a => a.ai_summary?.category === categoryFilter);

  if (loading) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 animate-pulse">
        <header className="flex items-center justify-between py-6 mb-4 border-b border-border/50">
          <div className="flex items-center gap-3 opacity-30">
            <WolfLogo className="w-8 h-8 grayscale" />
            <h1 className="text-2xl font-bold tracking-tight text-secondary">Roma<span className="text-primary">Flash</span></h1>
          </div>
          <div className="w-12 h-4 bg-gray-200 rounded"></div>
        </header>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <article key={i} className="relative overflow-hidden bg-white border border-border rounded-xl p-5">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200" />
              <div className="flex justify-between items-start mb-4">
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
                <div className="w-12 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="w-3/4 h-6 bg-gray-300 rounded mb-2"></div>
              <div className="w-1/2 h-6 bg-gray-300 rounded mb-6"></div>
            </article>
          ))}
        </section>
      </main>
    );
  }

  return (
    <PullToRefresh onRefresh={fetchArticles}>
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 lg:pb-12 relative">
        {newArticlesCount > 0 && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto">
            <button 
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0 });
                setNewArticlesCount(0);
                setCategoryFilter('Tutte');
                fetchArticles();
              }}
              className="bg-white text-gray-900 font-bold text-xs px-4 py-2 rounded-full shadow-xl border border-primary/30 hover:border-primary hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer pointer-events-auto"
            >
              <ArrowUp className="w-3.5 h-3.5 text-primary" />
              {newArticlesCount} {newArticlesCount === 1 ? t('home.new_article_single') : t('home.new_article_plural')}
            </button>
          </div>
        )}
        <GlobalHeader title="Le Ultime" />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* COLONNA SINISTRA: Feed Notizie */}
          <div className="flex-1 lg:w-[65%] xl:w-[70%] order-2 lg:order-1 flex flex-col">
            {/* Barre dei filtri orizzontale */}
            <div className="flex overflow-x-auto gap-2 pb-4 mb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    categoryFilter === cat 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'bg-white text-gray-600 hover:text-foreground border border-border'
                  }`}
                >
                  {translateCategory(cat)}
                </button>
              ))}
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  {t('home.no_news')} "{translateCategory(categoryFilter)}".
                </div>
              )}
              {filteredArticles?.map((article, index) => {
                const displayTitle = getArticleTitle(article);
                const displayExcerpt = getArticleExcerpt(article);
                const displayCategory = article.ai_summary?.category ? translateCategory(article.ai_summary.category) : '';

                return (
                  <motion.article 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: (index % 15) * 0.05, ease: 'easeOut' }}
                    whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.94 }}
                    key={article.id} 
                    className={`relative overflow-hidden group cursor-pointer transition-all duration-300 flex flex-col ${
                      index === 0 ? 'md:col-span-2 shadow-sm hover:shadow-md' : 'shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]'
                    } bg-card border border-border rounded-2xl`}
                    onClick={() => router.push(`/article?id=${article.id}`)}
                  >
                    {/* FIRST ITEM HERO LAYOUT */}
                    {index === 0 ? (
                      <>
                        <div className="h-56 md:h-72 bg-gradient-to-tr from-gray-50 via-white to-primary/10 relative overflow-hidden flex flex-col justify-end p-6 border-b border-border">
                          {article.ai_summary?.youtube_id && (
                            <img src={`https://img.youtube.com/vi/${article.ai_summary.youtube_id}/maxresdefault.jpg`} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" alt="Video" />
                          )}
                          <div className="relative z-10">
                            <div className="flex gap-2 mb-3">
                              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded shadow-md uppercase tracking-wide">
                                {t('home.featured')}
                              </span>
                              {article.ai_summary?.youtube_id && (
                                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide flex items-center gap-1 shadow-md">
                                  Video
                                </span>
                              )}
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                              {displayTitle}
                            </h2>
                          </div>
                        </div>
                        <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
                          <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2 md:line-clamp-3">
                            {displayExcerpt}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500 font-medium">
                            <div className="flex items-center gap-2">
                              {displayCategory && (
                                <span className="flex items-center gap-1 text-primary">
                                  {displayCategory}
                                </span>
                              )}
                            </div>
                            <span>{formatDate(article.published_at, lang)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* STANDARD CARD LAYOUT */
                      <>
                        {article.ai_summary?.youtube_id && (
                          <div className="h-48 relative overflow-hidden bg-black">
                            <img src={`https://img.youtube.com/vi/${article.ai_summary.youtube_id}/hqdefault.jpg`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" alt="Video" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex gap-2 mb-2">
                              {displayCategory && (
                                <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                  {displayCategory}
                                </span>
                              )}
                              {article.ai_summary?.sentiment && getSentimentBadge(article.ai_summary.sentiment)}
                            </div>
                            <h2 className="text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                              {displayTitle}
                            </h2>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {displayExcerpt}
                            </p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-gray-500 font-medium">
                            <span>{formatDate(article.published_at, lang)}</span>
                            <ShareButton title={displayTitle} text={displayExcerpt} url={`https://romaflash.app/article?id=${article.id}`} />
                          </div>
                        </div>
                      </>
                    )}
                  </motion.article>
                );
              })}
            </section>

            {/* PAGINAZIONE: Bottone esplicito su Desktop, Infinite Scroll su Mobile */}
            {hasMore && filteredArticles.length > 0 && (
              <>
                {/* Desktop: Bottone "Carica altre notizie" */}
                <div className="hidden lg:flex justify-center mt-8">
                  <button
                    type="button"
                    onClick={loadMoreArticles}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-full bg-white border border-border text-sm font-semibold text-gray-700 hover:text-primary hover:border-primary/40 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loadingMore ? t('home.loading_more') : t('home.load_more')}
                  </button>
                </div>

                {/* Mobile: Infinite Scroll Sentinel */}
                <div className="lg:hidden">
                  {loadingMore && (
                    <div className="py-6 text-center text-gray-500 text-sm animate-pulse">
                      {t('home.loading_more')}
                    </div>
                  )}
                  <div ref={loadMoreRef} className="h-10 w-full mt-4 flex items-center justify-center" />
                </div>
              </>
            )}

            {!hasMore && filteredArticles.length > 0 && categoryFilter === 'Tutte' && (
              <div className="py-8 text-center text-gray-500 text-sm">
                {t('home.end_of_news')} 🐺
              </div>
            )}
          </div>

          {/* COLONNA DESTRA: Widget e Utility */}
          <GlobalRightSidebar />
          
        </div>
      </main>
    </PullToRefresh>
  );
}
