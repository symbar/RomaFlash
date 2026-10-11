"use client";

import { useEffect, useState } from 'react';
import GlobalHeader from '@/components/GlobalHeader';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function CalendarioPage() {
  const { lang, t } = useLanguage();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data } = await supabase
        .from('calendar_matches')
        .select('*')
        .order('match_date', { ascending: true });
      if (data) setMatches(data);
      setLoading(false);
    };
    fetchMatches();
  }, []);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'it-IT', {
      timeZone: 'Europe/Rome',
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const getStatusColor = (status: string) => {
    if (status === 'FINISHED') return 'text-gray-500';
    if (status === 'IN_PLAY' || status === 'PAUSED') return 'text-green-600 animate-pulse';
    return 'text-primary';
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 lg:pb-12">
      <GlobalHeader title="Calendario Stagione" />

      <div className="space-y-4 mt-6">
        {matches?.map((match) => {
          const isHome = match.home_team.includes('Roma') && !match.home_team.includes('Lazio');
          const isFinished = match.status === 'FINISHED';
          
          return (
            <div key={match.id} className={`bg-white border border-border rounded-xl p-4 md:p-5 flex flex-col relative overflow-hidden shadow-sm ${!isFinished ? 'ring-1 ring-primary/20' : 'opacity-80'}`}>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <TrophyIcon comp={match.competition} />
                  {match.competition}
                </span>
                <span className={`text-xs font-bold uppercase flex items-center gap-1 ${getStatusColor(match.status)}`}>
                  <Clock className="w-3 h-3" />
                  {isFinished ? t('calendar.finished') : formatDate(match.match_date)}
                </span>
              </div>

              <div className="flex items-center justify-between px-2 md:px-8">
                {/* Home */}
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <div className="w-12 h-12 md:w-16 md:h-16 relative">
                    <img src={match.home_logo} alt={match.home_team} className="object-contain w-full h-full" />
                  </div>
                  <span className={`text-sm md:text-base font-bold text-center ${isHome ? 'text-primary' : 'text-gray-900'}`}>{match.home_team}</span>
                </div>

                {/* Score / VS */}
                <div className="flex flex-col items-center justify-center w-1/3">
                  {isFinished || match.status === 'IN_PLAY' || match.status === 'PAUSED' ? (
                    <div className="flex items-center gap-2 text-2xl md:text-4xl font-black text-gray-900">
                      <span>{match.score_home}</span>
                      <span className="text-gray-400">-</span>
                      <span>{match.score_away}</span>
                    </div>
                  ) : (
                    <div className="text-base md:text-lg font-black text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1 rounded-lg">VS</div>
                  )}
                </div>

                {/* Away */}
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <div className="w-12 h-12 md:w-16 md:h-16 relative">
                    <img src={match.away_logo} alt={match.away_team} className="object-contain w-full h-full" />
                  </div>
                  <span className={`text-sm md:text-base font-bold text-center ${!isHome ? 'text-primary' : 'text-gray-900'}`}>{match.away_team}</span>
                </div>
              </div>
              
            </div>
          );
        })}
        
        {!loading && matches.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {t('calendar.empty')}
          </div>
        )}
      </div>
    </main>
  );
}

function TrophyIcon({ comp }: { comp: string }) {
  const c = comp.toLowerCase();
  if (c.includes('serie a')) {
    return (
      <svg viewBox="0 0 100 120" className="w-3.5 h-4 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 0L10 15V50C10 85 50 120 50 120C50 120 90 85 90 50V15L50 0Z" fill="white"/>
        <path d="M10 15L36.6 5.2V115.1C23.3 103.4 10 81.3 10 50V15Z" fill="#009246"/>
        <path d="M36.6 5.2L63.3 0V120C63.3 120 63.3 120 63.3 120L36.6 115.1V5.2Z" fill="#F1F2F1"/>
        <path d="M63.3 0L90 15V50C90 81.3 76.6 103.4 63.3 115.1V0Z" fill="#CE2B37"/>
      </svg>
    );
  }
  if (c.includes('coppa')) {
    return (
      <svg viewBox="0 0 100 100" className="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#009246" />
        <circle cx="50" cy="50" r="33.3" fill="#F1F2F1" />
        <circle cx="50" cy="50" r="16.6" fill="#CE2B37" />
      </svg>
    );
  }
  if (c.includes('champions') || c.includes('europa') || c.includes('conference')) {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-yellow-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    );
  }
  return <CalendarIcon className="w-3.5 h-3.5" />;
}
