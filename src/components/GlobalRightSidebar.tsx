'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import NextMatchWidget from '@/components/NextMatchWidget';
import ClassificaWidget from '@/components/ClassificaWidget';
import { WolfLogo } from '@/components/Icons';
import { useLanguage } from '@/components/LanguageContext';

export default function GlobalRightSidebar() {
  const { t } = useLanguage();
  const [nextMatch, setNextMatch] = useState<any>(null);

  useEffect(() => {
    const fetchNextMatch = async () => {
      // Prende direttamente la prossima partita futura dal calendario sincronizzato
      const nowIso = new Date().toISOString();
      const { data: upcoming } = await supabase
        .from('calendar_matches')
        .select('*')
        .gt('match_date', nowIso)
        .order('match_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (upcoming) {
        setNextMatch(upcoming);
      } else {
        const { data } = await supabase
          .from('next_match')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (data && new Date(data.match_date).getTime() > Date.now()) {
          setNextMatch(data);
        }
      }
    };
    fetchNextMatch();
  }, []);

  return (
    <aside className={`${nextMatch ? 'flex' : 'hidden lg:flex'} w-full lg:w-[35%] xl:w-[30%] flex-col gap-6 order-1 lg:order-2 mb-2 lg:mb-0`}>
      {nextMatch && (
        <NextMatchWidget 
          homeTeam={nextMatch.home_team} 
          awayTeam={nextMatch.away_team} 
          competition={nextMatch.competition} 
          matchDate={nextMatch.match_date} 
        />
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
          {t('disclaimer.text')}
        </p>
        <p className="text-[10px] text-gray-600 mt-2">© 2026 RomaFlash.</p>
      </div>
    </aside>
  );
}
