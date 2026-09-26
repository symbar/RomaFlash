"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function ArticleContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      if (!id) return;
      const { data } = await supabase
        .from('articles')
        .select('*, sources(name)')
        .eq('id', id)
        .single();
      
      if (data) setArticle(data);
      setLoading(false);
    }
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-24 animate-pulse">
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
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Articolo non trovato</h1>
        <Link href="/" className="text-primary hover:underline">Torna alla home</Link>
      </main>
    );
  }

  const content = article.ai_summary?.content || "Contenuto in elaborazione...";

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-24">
      <header className="py-4 mb-6 border-b border-border/50">
        <Link href="/" className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 font-semibold mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Torna alle notizie
        </Link>
        
        <div className="flex items-center gap-3 text-xs uppercase tracking-wider mb-4">
          <span className="text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(article.published_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight text-white mb-6">
          {article.title}
        </h1>
      </header>

      <article className="text-base md:text-lg leading-relaxed text-gray-300">
        {content.split('\n').map((paragraph: string, idx: number) => (
          paragraph.trim() ? <p key={idx} className="mb-6">{paragraph}</p> : null
        ))}
      </article>
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
