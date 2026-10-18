"use client";

import { useEffect, useState } from 'react';
import { Trophy, Tv, Swords, Scale, Clock, Share2, Check } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { getMatchInsights, type MatchInsightsResponse, type H2HData, type RefereeData } from '@/lib/matchInsights';

export interface NextMatchProps {
  matchId?: number;
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

  // 1. Coppa Italia / Supercoppa -> Mediaset
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

  // 4. Serie A
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

    return [{ name: 'DAZN', type: 'dazn' }];
  }

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
    return (
      <svg viewBox="0 0 100 100" className="w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#009246" />
        <circle cx="50" cy="50" r="33.3" fill="#F1F2F1" />
        <circle cx="50" cy="50" r="16.6" fill="#CE2B37" />
      </svg>
    );
  }
  
  return <Trophy className="w-3 h-3 text-yellow-500 mr-1" />;
}

export default function NextMatchWidget({ matchId, homeTeam, awayTeam, competition, matchDate, tvChannels }: NextMatchProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'match' | 'h2h' | 'referee'>('match');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  
  // Dati H2H & Tassametro
  const [insights, setInsights] = useState<MatchInsightsResponse | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const opponent = (homeTeam.toLowerCase() === 'roma' ? awayTeam : homeTeam).trim();

  // Countdown timer
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
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [matchDate]);

  // Caricamento Insights (H2H e Arbitro)
  useEffect(() => {
    let isMounted = true;
    const cacheKey = `romaflash_insights_${matchId || ''}_${opponent}`.toLowerCase();

    // 1. Controllo localStorage locale per risposta istantanea (0ms)
    try {
      const saved = localStorage.getItem(cacheKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.h2h && isMounted) {
          setInsights(parsed);
        }
      }
    } catch {}

    async function fetchInsights() {
      try {
        setLoadingInsights(true);
        const data = await getMatchInsights({
          matchId,
          homeTeam,
          awayTeam,
          competition,
          matchDateIso: matchDate
        });
        if (isMounted && data?.h2h) {
          setInsights(data);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(data));
          } catch {}
        }
      } catch (e) {
        console.error('Failed to load match insights:', e);
      } finally {
        if (isMounted) setLoadingInsights(false);
      }
    }

    fetchInsights();

    return () => {
      isMounted = false;
    };
  }, [matchId, homeTeam, awayTeam, competition, matchDate, opponent]);

  const handleShare = async (title: string, text: string) => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title,
          text,
          url: window.location.href,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(`${title}\n${text}\nhttps://romaflash.app`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {}
  };

  if (!timeLeft) return null;

  const shortComp = competition
    .replace(/UEFA Champions League/i, 'Champions League')
    .replace(/UEFA Europa League/i, 'Europa League')
    .replace(/UEFA Conference League/i, 'Conference League');

  const broadcasters = getMatchBroadcasters(competition, matchDate, tvChannels);

  return (
    <div className="bg-gradient-to-r from-primary to-secondary p-[1px] shadow-sm overflow-hidden rounded-xl w-full">
      <div className="bg-white rounded-[11px] overflow-hidden flex flex-col">
        
        {/* Header Principale: Match + Selettore 3 Tab */}
        <div className="px-3 pt-2.5 pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-gray-500 flex items-center text-[10px] uppercase font-bold tracking-wider truncate">
              <CompetitionIcon competition={competition} />
              <span className="truncate">{shortComp}</span>
            </span>

            {/* Micro Tab Switcher: Gara | Storico | Arbitro */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-[10px] font-bold shrink-0">
              <button
                onClick={() => setActiveTab('match')}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                  activeTab === 'match'
                    ? 'bg-[#26050a] text-[#f0b516] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Gara</span>
              </button>

              <button
                onClick={() => setActiveTab('h2h')}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                  activeTab === 'h2h'
                    ? 'bg-[#26050a] text-[#f0b516] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Swords className="w-3 h-3" />
                <span>Storico</span>
              </button>

              <button
                onClick={() => setActiveTab('referee')}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                  activeTab === 'referee'
                    ? 'bg-[#26050a] text-[#f0b516] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Scale className="w-3 h-3" />
                <span>Arbitro</span>
              </button>
            </div>
          </div>

          <div className="font-extrabold text-gray-900 uppercase tracking-tight text-xs md:text-[13px] truncate">
            {homeTeam} <span className="text-yellow-600 font-bold mx-0.5">vs</span> {awayTeam}
          </div>
        </div>

        {/* TAB 1: GARA & COUNTDOWN NORMALE */}
        {activeTab === 'match' && (
          <div className="flex flex-col">
            <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="text-[11px] text-stone-500 font-medium">
                Calcio d'inizio tra:
              </div>

              {/* Countdown Numerico */}
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
        )}

        {/* TAB 2: PRECEDENTI HEAD-TO-HEAD (2.4) */}
        {activeTab === 'h2h' && (
          <div className="p-3 space-y-2.5 bg-[#fffdfa]">
            {loadingInsights && !insights?.h2h ? (
              <div className="py-6 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                <span className="animate-spin text-sm">⚽</span>
                <span>Analisi precedenti in corso...</span>
              </div>
            ) : insights?.h2h ? (
              <>
                {/* Scoreboard V - P - S Sintetico */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">⚔️</span>
                    <span className="text-[11px] font-bold text-stone-900">
                      Precedenti con {insights.h2h.opponent}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold bg-[#b45309]/10 text-[#b45309] px-1.5 py-0.5 rounded">
                    {insights.h2h.summary_badge || `${insights.h2h.total_matches} Sfide`}
                  </span>
                </div>

                {/* Badge 3 Colonne V - P - S */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg py-1 px-1.5">
                    <span className="text-xs font-black text-emerald-800 block leading-tight">{insights.h2h.roma_wins}</span>
                    <span className="text-[8.5px] uppercase font-bold text-emerald-700">Vittorie Roma</span>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 rounded-lg py-1 px-1.5">
                    <span className="text-xs font-black text-stone-800 block leading-tight">{insights.h2h.draws}</span>
                    <span className="text-[8.5px] uppercase font-bold text-stone-600">Pareggi</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200/80 rounded-lg py-1 px-1.5">
                    <span className="text-xs font-black text-rose-800 block leading-tight">{insights.h2h.roma_losses}</span>
                    <span className="text-[8.5px] uppercase font-bold text-rose-700">Sconfitte</span>
                  </div>
                </div>

                {/* Bilancio Reti */}
                <div className="bg-stone-100/70 rounded-lg py-1 px-2.5 flex items-center justify-around text-[10.5px]">
                  <div className="text-center">
                    <span className="text-stone-500 text-[9px] block">Gol Fatti</span>
                    <span className="font-bold text-[#b45309]">{insights.h2h.roma_goals_for} reti</span>
                  </div>
                  <div className="text-stone-300 font-bold">•</div>
                  <div className="text-center">
                    <span className="text-stone-500 text-[9px] block">Gol Subiti</span>
                    <span className="font-bold text-stone-700">{insights.h2h.roma_goals_against} reti</span>
                  </div>
                </div>

                {/* Lista Sfide Recenti */}
                {insights.h2h.matches && insights.h2h.matches.length > 0 ? (
                  <div className="space-y-1">
                    {insights.h2h.matches.slice(0, 4).map((m, idx) => {
                      const isWin = m.outcome === 'V';
                      const isDraw = m.outcome === 'P';
                      const badgeBg = isWin ? 'bg-emerald-600' : isDraw ? 'bg-stone-500' : 'bg-rose-600';

                      return (
                        <div key={idx} className="flex items-center justify-between p-1.5 rounded-md bg-white border border-stone-200/70 text-[10.5px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-3.5 h-3.5 rounded-full ${badgeBg} text-white text-[8px] font-black flex items-center justify-center shrink-0`}>
                              {m.outcome}
                            </span>
                            <span className="font-bold text-stone-900 truncate">{m.result}</span>
                          </div>
                          <div className="text-right shrink-0 text-stone-500 text-[9.5px]">
                            <span>{m.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-200/80 text-[10.5px] text-amber-900">
                    ✨ <strong>Incrocio Inedito:</strong> Nessun precedente ufficiale registrato tra i due club.
                  </div>
                )}

                {/* Nota Editoriale e Tasto Condividi */}
                <div className="pt-1 flex items-center justify-between text-[10px] text-stone-500 border-t border-stone-100">
                  <span className="truncate pr-2">{insights.h2h.note || 'Dati ufficiali AS Roma'}</span>
                  <button
                    onClick={() => handleShare(
                      `Precedenti Roma vs ${insights?.h2h?.opponent}`,
                      `Ultime sfide: ${insights?.h2h?.roma_wins} Vittorie Roma, ${insights?.h2h?.draws} Pareggi, ${insights?.h2h?.roma_losses} Sconfitte. Gol fatti: ${insights?.h2h?.roma_goals_for}, subiti: ${insights?.h2h?.roma_goals_against}.`
                    )}
                    className="flex items-center gap-1 text-[#8e1f2f] hover:text-[#26050a] font-bold shrink-0 bg-stone-100 px-2 py-0.5 rounded-md transition-colors"
                  >
                    {copiedShare ? <Check className="w-3 h-3 text-green-600" /> : <Share2 className="w-3 h-3" />}
                    <span>{copiedShare ? 'Copiato' : 'Condividi'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-xs text-stone-500">
                Precedenti non disponibili per questo match.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: IL TASSAMETRO ARBITRI (2.5) */}
        {activeTab === 'referee' && (
          <div className="p-3 space-y-2.5 bg-[#fffdfa]">
            {loadingInsights && !insights?.referee ? (
              <div className="py-6 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                <span className="animate-spin text-sm">🟨</span>
                <span>Analisi arbitro in corso...</span>
              </div>
            ) : insights?.referee && insights.referee.designated ? (
              <>
                {/* Header Arbitro */}
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🟨</span>
                    <div>
                      <h4 className="text-xs font-black text-stone-900 leading-tight">
                        {insights.referee.referee_name}
                      </h4>
                      <span className="text-[9.5px] text-stone-500 font-medium">
                        {insights.referee.section_or_country}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded border border-stone-200">
                    {insights.referee.total_matches} Partite
                  </span>
                </div>

                {/* Bilancio V-P-S dell'Arbitro con la Roma */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg py-1 px-1">
                    <span className="text-xs font-black text-emerald-800 block leading-tight">
                      {insights.referee.roma_wins} V • {insights.referee.draws} P
                    </span>
                    <span className="text-[8px] uppercase font-bold text-emerald-700">
                      {insights.referee.roma_win_rate_pct != null ? `${insights.referee.roma_win_rate_pct}% Vittorie` : 'Vittorie'}
                    </span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200/80 rounded-lg py-1 px-1">
                    <span className="text-xs font-black text-rose-800 block leading-tight">
                      {insights.referee.roma_losses}
                    </span>
                    <span className="text-[8px] uppercase font-bold text-rose-700">Sconfitte</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200/80 rounded-lg py-1 px-1">
                    <span className="text-xs font-black text-amber-800 block leading-tight">
                      {insights.referee.yellow_cards_avg || '4.5'}
                    </span>
                    <span className="text-[8px] uppercase font-bold text-amber-700">Gialli / Gara</span>
                  </div>
                </div>

                {/* Tassametro Rigori e Rossi */}
                <div className="bg-white border border-stone-200/80 rounded-lg p-2 space-y-1 text-[10.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600">🎯 Rigori con la Roma:</span>
                    <span className="font-bold text-stone-900">
                      <strong className="text-emerald-700">{insights.referee.penalties_for_roma ?? 0} pro</strong> • <strong className="text-rose-700">{insights.referee.penalties_against_roma ?? 0} contro</strong>
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-stone-100 pt-1">
                    <span className="text-stone-600">🟥 Espulsioni estratte:</span>
                    <span className="font-bold text-stone-900">
                      <strong className="text-rose-700">{insights.referee.red_cards_roma ?? 0} Roma</strong> • <strong className="text-stone-700">{insights.referee.red_cards_opponents ?? 0} Avv.</strong>
                    </span>
                  </div>
                </div>

                {/* Ultimo precedente */}
                {insights.referee.last_match && (
                  <div className="text-[9.5px] text-stone-600 bg-stone-50 p-1.5 rounded border border-stone-200/70">
                    <strong className="text-stone-900">Ultimo precedente:</strong> {insights.referee.last_match}
                  </div>
                )}

                {/* Footer con Tasto Condividi Tassametro */}
                <div className="pt-1 flex items-center justify-between text-[10px] text-stone-500 border-t border-stone-100">
                  <span className="truncate pr-2 font-medium">{insights.referee.note || 'Bilancio storico ufficiale'}</span>
                  <button
                    onClick={() => handleShare(
                      `Tassametro Arbitro: ${insights?.referee?.referee_name} con la Roma`,
                      `Bilancio con la Roma: ${insights?.referee?.total_matches} partite (${insights?.referee?.roma_wins}V, ${insights?.referee?.draws}P, ${insights?.referee?.roma_losses}S). Rigori: ${insights?.referee?.penalties_for_roma} a favore, ${insights?.referee?.penalties_against_roma} contro. Rossi alla Roma: ${insights?.referee?.red_cards_roma}.`
                    )}
                    className="flex items-center gap-1 text-[#8e1f2f] hover:text-[#26050a] font-bold shrink-0 bg-stone-100 px-2 py-0.5 rounded-md transition-colors"
                  >
                    {copiedShare ? <Check className="w-3 h-3 text-green-600" /> : <Share2 className="w-3 h-3" />}
                    <span>{copiedShare ? 'Copiato' : 'Condividi'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4 text-center space-y-1">
                <span className="text-xs">⏱️</span>
                <p className="text-[11px] font-bold text-stone-800">
                  Designazione in arrivo
                </p>
                <p className="text-[9.5px] text-stone-500 max-w-xs mx-auto">
                  L'AIA o la UEFA comunicano la designazione circa 36-48 ore prima della partita.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
