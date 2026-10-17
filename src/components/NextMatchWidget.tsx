"use client";

import { useEffect, useState } from 'react';
import { Trophy, Tv } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export interface NextMatchProps {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchDate: string; // ISO string
  tvChannels?: string[];
}

export type BroadcasterType = 'dazn' | 'sky' | 'now' | 'mediaset' | 'prime' | 'tv8' | 'generic';

export interface BroadcasterItem {
  name: string;
  type: BroadcasterType;
}

export function getMatchBroadcasters(
  competition: string,
  matchDateIso: string,
  explicitChannels?: string[]
): BroadcasterItem[] {
  if (explicitChannels && explicitChannels.length > 0) {
    return explicitChannels.map((ch) => {
      const lower = ch.toLowerCase();
      if (lower.includes('dazn')) return { name: 'DAZN', type: 'dazn' };
      if (lower.includes('sky')) return { name: 'sky sport', type: 'sky' };
      if (lower.includes('now')) return { name: 'NOW', type: 'now' };
      if (lower.includes('mediaset') || lower.includes('canale 5') || lower.includes('infinity')) {
        return { name: 'Canale 5 / Infinity', type: 'mediaset' };
      }
      if (lower.includes('prime')) return { name: 'Prime Video', type: 'prime' };
      if (lower.includes('tv8')) return { name: 'TV8', type: 'tv8' };
      return { name: ch, type: 'generic' };
    });
  }

  const comp = competition.toLowerCase();

  // 1. Coppa Italia / Supercoppa -> Esclusiva totale Mediaset (Canale 5 / Mediaset Infinity in chiaro)
  if (comp.includes('coppa italia') || comp.includes('supercoppa')) {
    return [{ name: 'Canale 5 / Infinity', type: 'mediaset' }];
  }

  // 2. Europa League / Conference League -> Sky Sport & NOW
  if (comp.includes('europa league') || comp.includes('conference league')) {
    return [
      { name: 'sky sport', type: 'sky' },
      { name: 'NOW', type: 'now' }
    ];
  }

  // 3. Champions League -> Sky Sport & NOW (+ Prime Video per mercoledì)
  if (comp.includes('champions league')) {
    const d = new Date(matchDateIso);
    if (d.getUTCDay() === 3) {
      return [
        { name: 'Prime Video', type: 'prime' },
        { name: 'sky sport', type: 'sky' },
        { name: 'NOW', type: 'now' }
      ];
    }
    return [
      { name: 'sky sport', type: 'sky' },
      { name: 'NOW', type: 'now' }
    ];
  }

  // 4. Serie A (Diritti 2024-2029)
  // DAZN trasmette SEMPRE tutte le 10 gare di ogni giornata.
  // Sky Sport & NOW trasmettono 3 partite a giornata in co-esclusiva negli slot fissi Lega Calcio:
  // - Sabato ore 20:45
  // - Domenica ore 12:30
  // - Lunedì ore 20:45 (o venerdì ore 20:45)
  if (comp.includes('serie a')) {
    try {
      const d = new Date(matchDateIso);
      const parts = new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(d);

      let weekday = '';
      let hour = 0;
      let minute = 0;
      for (const p of parts) {
        if (p.type === 'weekday') weekday = p.value.toLowerCase();
        if (p.type === 'hour') hour = parseInt(p.value, 10);
        if (p.type === 'minute') minute = parseInt(p.value, 10);
      }

      const isSatNight = (weekday.startsWith('sab') || weekday.startsWith('sat')) && hour === 20 && minute >= 30;
      const isSunLunch = (weekday.startsWith('dom') || weekday.startsWith('sun')) && (hour === 12 || (hour === 13 && minute <= 30));
      const isMonNight = (weekday.startsWith('lun') || weekday.startsWith('mon')) && hour === 20 && minute >= 30;
      const isFriNight = (weekday.startsWith('ven') || weekday.startsWith('fri')) && hour === 20 && minute >= 30;

      const isCoExclusive = isSatNight || isSunLunch || isMonNight || isFriNight;

      if (isCoExclusive) {
        return [
          { name: 'DAZN', type: 'dazn' },
          { name: 'sky sport', type: 'sky' },
          { name: 'NOW', type: 'now' }
        ];
      }
    } catch {
      // Fallback
    }

    // Default per tutte le altre gare di Serie A: Esclusiva DAZN
    return [{ name: 'DAZN', type: 'dazn' }];
  }

  // Default amichevoli o altre gare
  return [
    { name: 'DAZN', type: 'dazn' },
    { name: 'sky sport', type: 'sky' }
  ];
}

function BroadcasterBadge({ broadcaster }: { broadcaster: BroadcasterItem }) {
  switch (broadcaster.type) {
    case 'dazn':
      return (
        <span className="inline-flex items-center gap-1 bg-[#111111] text-white text-[9.5px] font-black px-1.5 py-0.5 rounded shadow-2xs tracking-wider shrink-0 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f3ff00]" />
          DAZN
        </span>
      );
    case 'sky':
      return (
        <span className="inline-flex items-center bg-gradient-to-r from-[#00195a] via-[#003893] to-[#c7173e] text-white text-[9.5px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs tracking-tight shrink-0 select-none">
          sky sport
        </span>
      );
    case 'now':
      return (
        <span className="inline-flex items-center gap-1 bg-[#022c22] text-[#00eb96] border border-[#047857]/40 text-[9.5px] font-black px-1.5 py-0.5 rounded shadow-2xs tracking-wider shrink-0 select-none">
          <span className="w-1 h-1 rounded-full bg-[#00eb96]" />
          NOW
        </span>
      );
    case 'mediaset':
      return (
        <span className="inline-flex items-center bg-gradient-to-r from-[#003366] to-[#0055a5] text-white text-[9.5px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs uppercase tracking-tight shrink-0 select-none">
          {broadcaster.name}
        </span>
      );
    case 'prime':
      return (
        <span className="inline-flex items-center gap-0.5 bg-[#001a2e] text-[#00a8e1] border border-[#00a8e1]/30 text-[9.5px] font-black px-1.5 py-0.5 rounded shadow-2xs shrink-0 select-none">
          <span className="text-white text-[8px] font-normal">prime</span>video
        </span>
      );
    case 'tv8':
      return (
        <span className="inline-flex items-center bg-[#1b1c20] text-amber-400 border border-gray-700 text-[9.5px] font-black px-1.5 py-0.5 rounded shadow-2xs shrink-0 select-none">
          TV8
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center bg-gray-800 text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded shadow-2xs shrink-0 select-none">
          {broadcaster.name}
        </span>
      );
  }
}

function CompetitionIcon({ competition }: { competition: string }) {
  const comp = competition.toLowerCase();
  
  if (comp.includes('serie a')) {
    // Scudetto tricolore
    return (
      <svg viewBox="0 0 100 120" className="w-3 h-3.5 mr-1" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 0L10 15V50C10 85 50 120 50 120C50 120 90 85 90 50V15L50 0Z" fill="white"/>
        <path d="M10 15L36.6 5.2V115.1C23.3 103.4 10 81.3 10 50V15Z" fill="#009246"/>
        <path d="M36.6 5.2L63.3 0V120C63.3 120 63.3 120 63.3 120L36.6 115.1V5.2Z" fill="#F1F2F1"/>
        <path d="M63.3 0L90 15V50C90 81.3 76.6 103.4 63.3 115.1V0Z" fill="#CE2B37"/>
      </svg>
    );
  }
  
  if (comp.includes('coppa italia')) {
    // Coccarda tricolore
    return (
      <svg viewBox="0 0 100 100" className="w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#009246" />
        <circle cx="50" cy="50" r="33.3" fill="#F1F2F1" />
        <circle cx="50" cy="50" r="16.6" fill="#CE2B37" />
      </svg>
    );
  }
  
  // Coppe europee o altro
  return <Trophy className="w-3 h-3 text-yellow-500 mr-1" />;
}

export default function NextMatchWidget({ homeTeam, awayTeam, competition, matchDate, tvChannels }: NextMatchProps) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(matchDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null); // Partita in corso o finita
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [matchDate]);

  if (!timeLeft) return null; // Nascondi il widget se non c'è una partita imminente

  const shortComp = competition
    .replace(/UEFA Champions League/i, 'Champions League')
    .replace(/UEFA Europa League/i, 'Europa League')
    .replace(/UEFA Conference League/i, 'Conference League');

  const broadcasters = getMatchBroadcasters(competition, matchDate, tvChannels);

  return (
    <div className="bg-gradient-to-r from-primary to-secondary p-[1px] shadow-sm overflow-hidden rounded-xl w-full">
      <div className="bg-white rounded-[11px] overflow-hidden flex flex-col">
        
        {/* Info Partita & Countdown */}
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs md:text-sm">
          {/* Info Partita */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-gray-500 flex items-center text-[10px] uppercase font-bold tracking-wider whitespace-nowrap mb-0.5">
              <CompetitionIcon competition={competition} />
              <span className="truncate">{shortComp}</span>
            </span>
            <span className="font-extrabold text-gray-900 uppercase tracking-tight text-xs md:text-[13px] whitespace-nowrap truncate">
              {homeTeam} <span className="text-yellow-600 font-bold mx-0.5">vs</span> {awayTeam}
            </span>
          </div>

          {/* Countdown */}
          <div className="flex items-center shrink-0">
            <div className="flex gap-1 text-center font-mono">
              <div className="flex flex-col">
                <span className="text-gray-900 font-bold text-xs md:text-sm bg-gray-100 px-1.5 py-0.5 rounded">{timeLeft.days}</span>
                <span className="text-[8px] md:text-[9px] text-gray-500 uppercase mt-0.5">{t('countdown.days')}</span>
              </div>
              <span className="text-gray-400 font-bold self-start mt-0.5">:</span>
              <div className="flex flex-col">
                <span className="text-gray-900 font-bold text-xs md:text-sm bg-gray-100 px-1.5 py-0.5 rounded">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <span className="text-[8px] md:text-[9px] text-gray-500 uppercase mt-0.5">{t('countdown.hours')}</span>
              </div>
              <span className="text-gray-400 font-bold self-start mt-0.5">:</span>
              <div className="flex flex-col">
                <span className="text-gray-900 font-bold text-xs md:text-sm bg-gray-100 px-1.5 py-0.5 rounded">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <span className="text-[8px] md:text-[9px] text-gray-500 uppercase mt-0.5">{t('countdown.minutes')}</span>
              </div>
              <span className="text-gray-400 font-bold self-start mt-0.5">:</span>
              <div className="flex flex-col">
                <span className="text-amber-600 font-bold text-xs md:text-sm bg-amber-50 px-1.5 py-0.5 rounded">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <span className="text-[8px] md:text-[9px] text-amber-600 uppercase mt-0.5">{t('countdown.seconds')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Bar Guida TV "Dove Vederla" */}
        {broadcasters.length > 0 && (
          <div className="bg-gray-50/90 border-t border-gray-100 px-3.5 py-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-gray-500 shrink-0">
              <Tv className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[9.5px] md:text-[10px] font-black uppercase tracking-wider text-gray-600">
                {t('match.tv_live') || 'In TV:'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {broadcasters.map((b, idx) => (
                <BroadcasterBadge key={idx} broadcaster={b} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
