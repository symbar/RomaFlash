'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import NextMatchWidget from '@/components/NextMatchWidget';
import ClassificaWidget from '@/components/ClassificaWidget';
import { WolfLogo } from '@/components/Icons';

export default function GlobalRightSidebar() {
  const [nextMatch, setNextMatch] = useState<any>(null);

  useEffect(() => {
    const fetchNextMatch = async () => {
      const { data } = await supabase
        .from('next_match')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (data) setNextMatch(data);
    };
    fetchNextMatch();
  }, []);

  return (
    <aside className="w-full lg:w-[35%] xl:w-[30%] flex flex-col gap-6 order-1 lg:order-2 mb-2 lg:mb-0">
      {nextMatch && (
        <div className="rounded-2xl overflow-hidden ring-1 ring-border shadow-lg">
          <NextMatchWidget 
            homeTeam={nextMatch.home_team} 
            awayTeam={nextMatch.away_team} 
            competition={nextMatch.competition} 
            matchDate={nextMatch.match_date} 
          />
        </div>
      )}
      
      <div className="hidden lg:block">
        <ClassificaWidget />
      </div>
      
      <div className="hidden lg:block bg-card/50 rounded-2xl p-6 border border-border mt-6">
        <div className="flex items-center gap-2 mb-2">
          <WolfLogo className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-bold text-gray-400">RomaFlash</span>
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Questo sito non rappresenta una testata giornalistica in quanto viene aggiornato senza alcuna periodicità. 
          Non può considerarsi un prodotto editoriale ai sensi della legge n° 62 del 7.03.2001. 
          Non affiliato all'AS Roma.
        </p>
        <p className="text-[10px] text-gray-600 mt-2">© 2026 RomaFlash.</p>
      </div>
    </aside>
  );
}
