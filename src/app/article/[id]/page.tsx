import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function ArticlePage({ params }: { params: { id: string } }) {
  // Wait for params in Next.js 15
  const { id } = await params;

  const { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      sources ( name )
    `)
    .eq('id', id)
    .single();

  if (!article) {
    return notFound();
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
          <span className="font-bold text-primary">{article.sources?.name || 'News'}</span>
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
