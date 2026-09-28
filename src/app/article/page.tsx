"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Clock, Flame, Snowflake, MessageCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ShareButton from '@/components/ShareButton';
import { Tweet } from 'react-tweet';
import PitchView from '@/components/PitchView';
import PollWidget from '@/components/PollWidget';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
  const timeString = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return timeString;
  const dayMonth = date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  return `${dayMonth} ${timeString}`;
}

function ArticleContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [article, setArticle] = useState<any>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      if (!id) return;
      const { data } = await supabase
        .from('articles')
        .select('*, sources(name)')
        .eq('id', id)
        .single();
      
      if (data) {
        setArticle(data);
        
        // Fetch related articles (same category)
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
  }, [id]);

  if (loading) {
    return (
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-32 animate-pulse">
        <div className="w-24 h-6 bg-gray-800 rounded mb-8"></div>
        <div className="w-3/4 h-10 bg-gray-700 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="w-full h-4 bg-gray-800 rounded"></div>
          <div className="w-full h-4 bg-gray-800 rounded"></div>
          <div className="w-5/6 h-4 bg-gray-800 rounded"></div>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-32 text-center">
        <h1 className="text-2xl font-bold mb-4">Articolo non trovato</h1>
        <Link href="/" className="text-primary hover:underline">Torna alla home</Link>
      </main>
    );
  }

  const content = article.ai_summary?.content || "Contenuto in elaborazione...";

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
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Snowflake className="w-3 h-3" /> Cold
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/20">
        <MessageCircle className="w-3 h-3" /> News
      </span>
    );
  };

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-32">
      <header className="py-4 mb-6 border-b border-border/50">
        <Link href="/" className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 font-semibold mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Torna alle notizie
        </Link>
        
        <div className="flex items-center gap-3 text-xs uppercase tracking-wider mb-4">
          {article.ai_summary?.category && (
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-800 text-primary">
              {article.ai_summary.category}
            </span>
          )}
          {article.ai_summary?.sentiment && getSentimentBadge(article.ai_summary.sentiment)}
          <div className="flex items-center gap-3 ml-auto text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(article.published_at)}
            </span>
            <ShareButton 
              title={article.title} 
              text={article.ai_summary?.excerpt} 
              url={`https://romaflash.pages.dev/article?id=${article.id}`} 
            />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight text-white mb-6">
          {article.title}
        </h1>
      </header>

      <article className="text-base md:text-lg leading-relaxed text-foreground">
        {(() => {
          const paragraphs = content.split('\n').filter((p: string) => p.trim() !== '');
          const hasTweet = article.ai_summary?.social_embed_url && (article.ai_summary.social_embed_url.includes('twitter.com') || article.ai_summary.social_embed_url.includes('x.com'));
          const tweetId = hasTweet ? article.ai_summary.social_embed_url.split('status/')[1]?.split('?')[0] : '';
          
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

      {article.ai_summary?.poll && (
        <PollWidget articleId={article.id} poll={article.ai_summary.poll} />
      )}

      {relatedArticles.length > 0 && (
        <section className="mt-16 pt-8 border-t border-border/50">
          <h3 className="text-xl font-serif font-bold mb-6 text-white flex items-center gap-2">
            Continua a leggere <span className="text-sm font-sans font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{article.ai_summary.category}</span>
          </h3>
          <div className="space-y-4">
            {relatedArticles.map((rel) => (
              <Link 
                key={rel.id} 
                href={`/article?id=${rel.id}`}
                className="block p-4 rounded-xl bg-card border border-border hover:bg-card/80 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-base font-bold text-foreground leading-tight">
                    {rel.title}
                  </h4>
                  {rel.ai_summary?.sentiment && getSentimentBadge(rel.ai_summary.sentiment)}
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(rel.published_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
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


