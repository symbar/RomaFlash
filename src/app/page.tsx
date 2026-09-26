import { Flame, Clock, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6">
      <header className="flex items-center justify-between py-6 mb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Flame className="text-secondary w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight">Roma<span className="text-primary">Flash</span></h1>
        </div>
        <div className="text-xs text-gray-400 font-mono">
          <Clock className="inline w-3 h-3 mr-1" />
          Live
        </div>
      </header>

      <section className="space-y-4">
        {/* Placeholder per il primo articolo (lo sostituiremo con i dati veri di Supabase) */}
        <article className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Calciomercato</span>
            <span className="text-xs text-gray-500">10 min fa</span>
          </div>
          
          <h2 className="text-xl font-bold leading-tight mb-3">
            Accordo raggiunto per il nuovo attaccante: le cifre dell'affare
          </h2>
          
          <ul className="space-y-2 mb-4 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
              <span>Contratto di 4 anni a 2.5 milioni a stagione.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
              <span>Domani previste le visite mediche a Villa Stuart.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
              <span>La Roma verserà 15 milioni più 3 di bonus nelle casse del club cedente.</span>
            </li>
          </ul>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <span className="text-xs text-gray-500">Fonte: Corriere dello Sport</span>
            <button className="text-primary text-sm font-semibold flex items-center gap-1 hover:text-primary/80">
              Leggi originale <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </article>

        {/* Placeholder 2 */}
        <article className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Trigoria</span>
            <span className="text-xs text-gray-500">2 ore fa</span>
          </div>
          <h2 className="text-xl font-bold leading-tight mb-3">
            Allenamento mattutino: due giocatori a parte
          </h2>
          <ul className="space-y-2 mb-4 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
              <span>Lavoro di scarico per i titolari dell'ultima partita.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
              <span>Ancora differenziato per i due infortunati, out per la prossima gara.</span>
            </li>
          </ul>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <span className="text-xs text-gray-500">Fonte: VoceGiallorossa</span>
            <button className="text-primary text-sm font-semibold flex items-center gap-1 hover:text-primary/80">
              Leggi originale <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
