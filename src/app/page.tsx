"use client";

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import PushNotificationManager from '@/components/PushNotificationManager';

const WolfLogo = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 512 512">
    <path fill="#f0b516" d="M179.3 38.94C154.7 77.7 142.7 139.7 168.4 185.9l-16.3 9.2c-6.7-11.9-11.2-24.4-13.9-37.2c-34.5-6.3-69.42-7.5-104.98-2.1c34.07 10.1 52.77 23.7 76.68 46.7c-26.82 9.7-60.25 30.2-92.93 70.2c35.47-8.8 64.83-11.5 89.43-6.3c-36.94 22.5-64.06 56.1-88.34 114.1c35.9-17.2 64.89-18.8 102.94-18.8c-23.07 32.7-35.27 77.2-36.31 112.8c24.51-26 57.61-60.2 87.21-79c3 29.9 15 58.3 35.9 85.3c-.2-43.9 10.3-88.3 31.6-133.4c-18.8 9-32.4 18.1-49.9 29.3c6.2-27.9 12.4-55.8 18.7-83.7c-23.3 2.4-39 10-60.5 18.5c16.3-33.1 32.7-66.1 49.1-99.2l16.8 8.3l-28.4 57.4c18.4-4.4 28.7-4.1 45.7-1.3c-4.5 20.4-9 40.7-13.6 61c65.3-36.2 148.3-45.9 226.7-50c7.6-12.9 13.8-24.2 18.8-34.8l-6.3-24.4l-24.4 30.8l-7.8-27.5l-22.5 29.2l-7.5-26.1l-23.9 31.5l-7.7-28.2l-23.8 31.4l1.2-41.1l22.6-42.7l7.6 28.3l23.9-31.5l7.6 28.2l23.5-30l6.5 26.9l24.5-30.8l7.8 27.5l24.6-32c2.3-10.8 4.6-22.4 7.4-35.7c-55.5-3.7-106.3 4.8-154 9.8c-38-20.8-80.8-26.8-121.9-18.5c-13.6-29.69-27.2-59.38-40.9-89.06M325.5 158.3c-4.5 14.2-13 18.3-24.7 20.6c-16.1-4.4-28.3-15.5-34.4-30.2c20.4-3.8 42.4 3.4 59.1 9.6"/>
  </svg>
);

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('Tutte');

  useEffect(() => {
    async function fetchArticles() {
      const { data } = await supabase
        .from('articles')
        .select('*, sources(name)')
        .order('published_at', { ascending: false })
        .limit(30); // Aumentato a 30 per avere più dati da filtrare
      
      if (data) setArticles(data);
      setLoading(false);
    }
    fetchArticles();
  }, []);

  const getSentimentIcon = (sentiment?: string) => {
    if (sentiment === 'Positivo') return '🔥';
    if (sentiment === 'Negativo') return '❄️';
    return '💬';
  };

  const categories = ['Tutte', 'Calciomercato', 'Partita', 'Infortunio', 'Dichiarazioni', 'Club', 'Altro'];
  
  const filteredArticles = categoryFilter === 'Tutte' 
    ? articles 
    : articles.filter(a => a.ai_summary?.category === categoryFilter);

  if (loading) {
    return (
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 animate-pulse">
        <header className="flex items-center justify-between py-6 mb-4 border-b border-border/50">
          <div className="flex items-center gap-3 opacity-30">
            <WolfLogo className="w-8 h-8 grayscale" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Roma<span className="text-gray-400">Flash</span></h1>
          </div>
          <div className="w-12 h-4 bg-gray-800 rounded"></div>
        </header>
        <section className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <article key={i} className="relative overflow-hidden bg-card/30 border border-border/30 rounded-xl p-5">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-800/50" />
              <div className="flex justify-between items-start mb-4">
                <div className="w-20 h-3 bg-gray-800 rounded"></div>
                <div className="w-12 h-3 bg-gray-800 rounded"></div>
              </div>
              <div className="w-3/4 h-6 bg-gray-700/50 rounded mb-2"></div>
              <div className="w-1/2 h-6 bg-gray-700/50 rounded mb-6"></div>
            </article>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-24">
      <header className="flex items-center justify-between py-6 mb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <WolfLogo className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight">Roma<span className="text-primary">Flash</span></h1>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Live Feed
        </div>
      </header>
      
      <PushNotificationManager />

      {/* Barre dei filtri orizzontale */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === cat 
                ? 'bg-primary text-black' 
                : 'bg-card text-gray-400 hover:text-white border border-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="space-y-4">
        {filteredArticles.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            Nessuna notizia trovata per "{categoryFilter}".
          </div>
        )}
        {filteredArticles?.map((article) => (
          <article key={article.id} className="relative overflow-hidden bg-card hover:bg-card/80 transition-colors border border-border rounded-xl p-5">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-secondary opacity-80" />
            
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {article.ai_summary?.category && (
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-800 text-primary">
                    {article.ai_summary.category}
                  </span>
                )}
                {article.ai_summary?.sentiment && (
                  <span className="text-sm" title={article.ai_summary.sentiment}>
                    {getSentimentIcon(article.ai_summary.sentiment)}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(article.published_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <h2 className="text-2xl font-serif font-bold leading-tight mb-4 text-white">
              <Link href={`/article?id=${article.id}`} className="hover:text-primary transition-colors">
                {article.title}
              </Link>
            </h2>

            <div className="mb-4 text-gray-300 text-sm leading-relaxed">
              {article.ai_summary && !Array.isArray(article.ai_summary) && article.ai_summary.excerpt ? (
                <p>{article.ai_summary.excerpt}</p>
              ) : (
                <p className="text-gray-500 italic">Clicca il titolo per leggere l'articolo.</p>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
