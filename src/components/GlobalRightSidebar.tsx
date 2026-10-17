'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import NextMatchWidget from '@/components/NextMatchWidget';
import ClassificaWidget from '@/components/ClassificaWidget';

export default function GlobalRightSidebar() {
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
          tvChannels={nextMatch.tv_channels}
        />
      )}
      
      <div className="hidden lg:block">
        <ClassificaWidget />
      </div>
    </aside>
  );
}
