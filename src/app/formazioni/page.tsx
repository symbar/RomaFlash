
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

import GlobalHeader from '@/components/GlobalHeader';
import PullToRefresh from '@/components/PullToRefresh';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';

const initialMatchData = {
  homeTeam: "Casa",
  homeLogo: "https://crests.football-data.org/100.png",
  awayTeam: "Roma",
  awayLogo: "https://crests.football-data.org/100.png",
  date: "",
  stadium: "",
  lastUpdate: "-"
};

// --- COMPONENTS ---

function ProgressBar({ prob }: { prob: number }) {
  const getColor = () => {
    if (prob >= 80) return 'bg-green-500';
    if (prob >= 50) return 'bg-orange-500';
    return 'bg-gray-400';
  };
  
  return (
    <div className="w-5 md:w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
      <div className={`h-full ${getColor()} rounded-full`} style={{ width: `${prob}%` }} />
    </div>
  );
}



function DynamicDetails({ details, color }: { details: any, color: string }) {
  const { lang, t } = useLanguage();
  if (!details) return <div className="text-center text-xs text-gray-500 mb-8">{t('lineups.none')}</div>;

  return (
    <>
      {/* BALLOTTAGGI */}
      <div className="flex justify-center mb-4 md:mb-6">
        <span className="bg-purple-600 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 md:px-3 md:py-1 rounded-full shadow-xs">{t('lineups.ballottaggi')}</span>
      </div>
      {(!details.Ballottaggi || details.Ballottaggi.length === 0) ? (
        <div className="text-center text-[11px] md:text-xs text-gray-400 mb-6 md:mb-8">{t('lineups.none_ballottaggi')}</div>
      ) : (
        details.Ballottaggi.map((group: any, idx: number) => {
          const topPlayer = group[0];
          const secondPlayer = group[1];
          return (
            <div key={idx} className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
              <DonutChart prob={topPlayer.prob} color="#8b5cf6" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs md:text-sm font-bold text-gray-900 flex items-center gap-1.5 truncate">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0" style={{backgroundColor: color}}></div>
                    <span className="truncate">{topPlayer.name}</span>
                  </span>
                  <span className="text-[10px] md:text-xs font-bold text-gray-900 ml-1 shrink-0">{topPlayer.prob}%</span>
                </div>
                {secondPlayer && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] md:text-sm text-gray-600 flex items-center gap-1.5 truncate">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 opacity-50" style={{backgroundColor: color}}></div>
                      <span className="truncate">{secondPlayer.name}</span>
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-gray-600 ml-1 shrink-0">{secondPlayer.prob}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* SQUALIFICATI */}
      <div className="flex justify-center mb-3 md:mb-4 mt-6 md:mt-8">
        <span className="bg-red-500 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 md:px-3 md:py-1 rounded-full shadow-xs">{t('lineups.squalificati')}</span>
      </div>
      {(!details.Squalificati || details.Squalificati.length === 0) ? (
        <div className="text-center text-[11px] md:text-xs text-gray-400 mb-6 md:mb-8">{t('lineups.none')}</div>
      ) : (
        <div className="mb-6 md:mb-8">
          {details.Squalificati.map((item: any, idx: number) => (
            <div key={idx} className="mb-2">
              <div className="text-xs md:text-sm font-bold text-gray-900 mb-0.5">{item.name}</div>
              {item.desc && <div className="text-[10px] md:text-xs text-gray-600 leading-tight">{item.desc}</div>}
            </div>
          ))}
        </div>
      )}

      {/* DIFFIDATI */}
      <div className="flex justify-center mb-3 md:mb-4">
        <span className="bg-yellow-500 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 md:px-3 md:py-1 rounded-full shadow-xs">{t('lineups.diffidati')}</span>
      </div>
      {(!details.Diffidati || details.Diffidati.length === 0) ? (
        <div className="text-center text-[11px] md:text-xs text-gray-400 mb-6 md:mb-8">{t('lineups.none')}</div>
      ) : (
        <div className="mb-6 md:mb-8">
          {details.Diffidati.map((item: any, idx: number) => (
            <div key={idx} className="mb-2">
              <div className="text-xs md:text-sm font-bold text-gray-900 mb-0.5">{item.name}</div>
              {item.desc && <div className="text-[10px] md:text-xs text-gray-600 leading-tight">{item.desc}</div>}
            </div>
          ))}
        </div>
      )}

      {/* INFORTUNATI */}
      <div className="flex justify-center mb-3 md:mb-4">
        <span className="bg-orange-500 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 md:px-3 md:py-1 rounded-full shadow-xs">{t('lineups.infortunati')}</span>
      </div>
      {(!details.Infortunati || details.Infortunati.length === 0) ? (
        <div className="text-center text-[11px] md:text-xs text-gray-400 mb-6 md:mb-8">{t('lineups.none')}</div>
      ) : (
        <div className="mb-6 md:mb-8">
          {details.Infortunati.map((item: any, idx: number) => (
            <div key={idx} className="mb-2.5">
              <div className="text-xs md:text-sm font-bold text-gray-900 mb-0.5">{item.name}</div>
              {item.desc && <div className="text-[10px] md:text-xs text-gray-600 leading-tight">{item.desc}</div>}
            </div>
          ))}
        </div>
      )}

      {/* IN DUBBIO */}
      <div className="flex justify-center mb-4">
        <span className="bg-cyan-400 text-[#ffffff] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">{lang === 'en' ? 'Doubtful' : 'In dubbio'}</span>
      </div>
      {(!details['In dubbio'] || details['In dubbio'].length === 0) ? (
        <div className="text-center text-xs text-gray-500 mb-8">{t('lineups.none')}</div>
      ) : (
        <div className="mb-4">
          {details['In dubbio'].map((item: any, idx: number) => (
            <div key={idx} className="mb-2">
              <div className="text-sm font-bold text-gray-900 mb-1">{item.name}</div>
              {item.desc && <div className="text-xs text-gray-600">{item.desc}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}


function PlayerRow({ player, isAway }: { player: any, isAway: boolean }) {
  const RoleIcon = () => (
    <span className={`flex items-center justify-center w-3.5 h-3.5 md:w-4 md:h-4 rounded-full text-[8px] md:text-[9px] font-bold text-white shrink-0
      ${player.role === 'P' ? 'bg-yellow-500' : 
        player.role === 'D' ? 'bg-green-500' : 
        player.role === 'C' ? 'bg-blue-500' : 
        player.role === 'A' ? 'bg-red-500' : 'bg-gray-600'}`}>
      {player.role || '-'}
    </span>
  );

  return (
    <div className="flex items-center justify-between py-1.5 md:py-2 border-b border-border/50 last:border-0 hover:bg-gray-50 transition-colors px-1 gap-1">
      <div className={`flex items-center gap-1 md:gap-2 min-w-0 ${isAway ? 'order-2 flex-row-reverse text-right' : 'order-1'}`}>
        <RoleIcon />
        <span className={`font-semibold text-[11px] md:text-sm truncate ${player.ballottaggio ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
          {player.name}
        </span>
      </div>
      <div className={`flex items-center gap-1 md:gap-2 shrink-0 ${isAway ? 'order-1' : 'order-2'}`}>
        <span className="text-[10px] md:text-xs font-mono text-gray-500 w-6 md:w-8 text-center">{player.prob}%</span>
        <ProgressBar prob={player.prob} />
      </div>
    </div>
  );
}

function TeamList({ teamName, formation, players, isAway }: { teamName: string, formation: string, players: any, isAway: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="w-full bg-white border border-border rounded-xl overflow-hidden shadow-sm">
      <div className={`px-2.5 md:px-4 py-2 border-b border-border flex justify-between items-center ${isAway ? 'bg-primary/10' : 'bg-gray-100'}`}>
        <span className={`font-bold text-xs md:text-sm truncate ${isAway ? 'text-primary' : 'text-gray-900'}`}>{teamName}</span>
        <span className="text-[10px] md:text-xs font-mono text-gray-500 font-bold shrink-0">{formation}</span>
      </div>
      <div className="p-1 md:p-3">
        {players.starters.map((p: any, i: number) => (
          <PlayerRow key={i} player={p} isAway={isAway} />
        ))}
      </div>
      <div className="bg-gray-50 px-2 md:px-4 py-1.5 border-y border-border text-center">
        <span className="text-[9px] md:text-[10px] font-semibold text-gray-500 uppercase tracking-widest bg-white px-2.5 py-0.5 rounded-full border border-border shadow-2xs">{t('lineups.bench')}</span>
      </div>
      <div className="p-1 md:p-3 opacity-75">
        {players.bench.map((p: any, i: number) => (
          <PlayerRow key={i} player={p} isAway={isAway} />
        ))}
      </div>
    </div>
  );
}


function getCondensedPattern(formationStr: string): number[] {
  const rawParts = (formationStr || '4-4-2').split('-').map(Number).filter(n => !isNaN(n) && n > 0);
  if (rawParts.length === 0) return [1, 4, 4, 2];
  if (rawParts.length <= 3) {
    // Già strutturato su 3 linee (es. 4-4-2, 4-3-3, 3-5-2, 3-4-3, 5-3-2)
    return [1, ...rawParts];
  }
  
  // Moduli a 4 o più linee (es. 4-4-1-1, 3-4-2-1, 4-2-3-1, 4-3-1-2, 3-4-1-2, 4-1-4-1):
  // Raggruppiamo l'attacco appaiando punte e trequartisti, garantendo 4 colonne totali (Portiere + Difesa + Centrocampo + Attacco).
  // In questo modo su mobile tutti i giocatori sono perfettamente visibili senza sovrapposizioni.
  const def = rawParts[0];
  let mid: number;
  let att: number;

  if (rawParts.length === 4) {
    if (rawParts[1] === 1 && rawParts[2] >= 3) {
      // Es. 4-1-4-1: un mediano + 4 centrocampisti avanzati -> centrocampo a 5, punta singola
      mid = rawParts[1] + rawParts[2];
      att = rawParts[3];
    } else {
      // Es. 4-4-1-1 -> [4, 4, 2] (Messias e Osmajic appaiati)
      // Es. 3-4-2-1 -> [3, 4, 3] (Soulè, Mora, Castro appaiati)
      // Es. 4-2-3-1 -> [4, 2, 4] (3 trequartisti + 1 punta appaiati in attacco)
      // Es. 4-3-1-2 -> [4, 3, 3] (trequartista e le due punte appaiati)
      mid = rawParts[1];
      att = rawParts.slice(2).reduce((sum, n) => sum + n, 0);
    }
  } else {
    mid = rawParts[1];
    att = rawParts.slice(2).reduce((sum, n) => sum + n, 0);
  }

  return [1, def, mid, att];
}

function DynamicFormationGrid({ starters, formationStr, isAway }: { starters: any[], formationStr: string, isAway?: boolean }) {
  const pattern = getCondensedPattern(formationStr);
  let currentIndex = 0;
  const columns = pattern.map(count => {
    const playersInColumn = starters.slice(currentIndex, currentIndex + count);
    currentIndex += count;
    return playersInColumn;
  });

  const getColStyle = (count: number, colIdx: number, totalCols: number) => {
    if (colIdx === 0) {
      // Portiere (GK)
      return 'h-[55%] justify-center';
    }
    if (count === 1) {
      return 'h-[55%] justify-center';
    }
    if (count === 2) {
      // Due giocatori (es. coppia d'attacco appaiata come Messias - Osmajic)
      return 'h-[50%] justify-around py-1';
    }
    if (count === 3) {
      // Tre giocatori (es. difesa a 3 o tridente d'attacco)
      return colIdx === 1 ? 'h-[80%] justify-between py-1.5' : 'h-[68%] justify-around py-1';
    }
    if (count === 4) {
      // Quattro giocatori: alterniamo l'altezza tra Difesa e Centrocampo (zig-zag)
      // così difensori e centrocampisti non condividono le stesse coordinate Y verticali
      if (colIdx === 1) {
        return 'h-[94%] justify-between py-1';
      }
      return 'h-[78%] justify-around py-2';
    }
    if (count >= 5) {
      return 'h-[96%] justify-between py-0.5';
    }
    return 'h-full justify-around';
  };

  return (
    <div
      className={`flex-1 flex ${isAway ? 'flex-row-reverse pl-2 md:pl-6' : 'pr-2 md:pr-6'} items-center justify-between relative z-10 h-full`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {columns.map((colPlayers, colIdx) => (
        <div
          key={colIdx}
          className={`${colIdx === 0 ? 'w-6 sm:w-8 md:w-14 shrink-0' : 'flex-1'} flex flex-col items-center ${getColStyle(colPlayers.length, colIdx, columns.length)}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {colPlayers.map((player, pIdx) => (
            <PlayerDot
              key={pIdx}
              name={player.name || player}
              isAway={isAway}
              ballottaggio={player.ballottaggio}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function PlayerDot({ name, ballottaggio, isAway }: { name: string, ballottaggio?: boolean, isAway?: boolean }) {
  const isLong = name.length > 8;
  return (
    <div
      className="flex flex-col items-center justify-center z-10 w-full [transform:translateZ(10px)_rotateX(-20deg)] md:[transform:translateZ(14px)_rotateX(-36deg)]"
      style={{ transformOrigin: 'bottom center' }}
    >
      <div
        className={`inline-flex items-center justify-center gap-0.5 px-1 py-0.5 md:px-2 md:py-0.5 rounded md:rounded-md shadow-md border whitespace-nowrap backdrop-blur-md leading-tight text-center ${
          isAway
            ? 'bg-black/95 text-white border-white/40'
            : 'bg-[#8e1f2f]/95 text-white border-[#f0b516]/60'
        }`}
        title={name}
      >
        {ballottaggio && (
          <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-purple-400 shrink-0" title="Ballottaggio" />
        )}
        <span
          className={`${
            isLong ? 'text-[7px] sm:text-[7.5px] md:text-[11px]' : 'text-[8px] sm:text-[8.5px] md:text-[12px]'
          } font-bold tracking-tight block max-w-[50px] sm:max-w-[62px] md:max-w-none truncate text-center`}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

function DonutChart({ prob, color, size = 48 }: { prob: number, color: string, size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (prob / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="currentColor" className="text-border" strokeWidth={strokeWidth} />
        <circle 
          cx={size/2} cy={size/2} r={radius} fill="transparent" stroke={color} strokeWidth={strokeWidth} 
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" 
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-gray-900 dark:text-[#ffffff]">{prob}%</span>
    </div>
  );
}

function buildDynamicCommentary(teamName: string, state: any): string {
  const explicit = (state?.details?.commentary || "").trim();
  if (explicit && explicit.toLowerCase() !== "nessuna notizia") {
    return explicit;
  }
  const starters = Array.isArray(state?.starters) ? state.starters : [];
  if (starters.length === 0) {
    return "In attesa delle indicazioni ufficiali dai campi di allenamento.";
  }
  const gk = starters.filter((p: any) => (p.role || "").toUpperCase() === "P").map((p: any) => p.name);
  const defs = starters.filter((p: any) => (p.role || "").toUpperCase() === "D").map((p: any) => p.name);
  const mids = starters.filter((p: any) => (p.role || "").toUpperCase() === "C").map((p: any) => p.name);
  const fwds = starters.filter((p: any) => (p.role || "").toUpperCase() === "A").map((p: any) => p.name);

  const parts: string[] = [`${teamName} verso il modulo ${state.formation || "N/A"}.`];
  if (gk.length > 0 && defs.length > 0) {
    parts.push(`Tra i pali ${gk[0]}, con il reparto arretrato formato da ${defs.join(", ")}.`);
  }
  if (mids.length > 0) {
    parts.push(`A centrocampo spazio a ${mids.join(", ")}.`);
  }
  if (fwds.length > 0) {
    parts.push(`In avanti pronti ${fwds.join(" e ")}.`);
  }
  const outNames = [
    ...(state?.details?.Squalificati || []).map((x: any) => x.name),
    ...(state?.details?.Infortunati || []).map((x: any) => x.name),
  ].filter(Boolean);
  if (outNames.length > 0) {
    parts.push(`Indisponibili: ${outNames.join(", ")}.`);
  }
  return parts.join(" ");
}

export default function FormazioniPage() {
  const { lang, t } = useLanguage();
  const [matchState, setMatchState] = useState(initialMatchData);
  const [homeState, setHomeState] = useState({
    formation: "4-2-3-1",
    bench: [] as any[],
    starters: [] as any[],
    details: null as any
  });
  const [awayState, setAwayState] = useState({
    formation: "3-4-2-1",
    bench: [] as any[],
    starters: [] as any[],
    details: null as any
  });
  
  const fetchLineups = async () => {
    try {
      // 1. Fetch Roma first to know the match
      const { data: romaData, error } = await supabase
        .from('lineups')
        .select('*')
        .eq('team', 'Roma')
        .single();
        
      if (romaData && !error) {
        const teams = romaData.match_name.split(' - ');
        const isRomaHome = teams[0] === 'Roma';
        const opponentName = isRomaHome ? teams[1] : teams[0];
        
        // 2. Fetch opponent
        const { data: oppData } = await supabase
          .from('lineups')
          .select('*')
          .eq('team', opponentName)
          .single();

        // 3. Fetch team logos from standings
        const { data: standingsData } = await supabase
          .from('standings')
          .select('team_name, team_logo');

        const findLogo = (name: string, fallback: string) => {
          const match = standingsData?.find((s: any) => s.team_name.toLowerCase().includes(name.toLowerCase()));
          return match?.team_logo || fallback;
        };
        
        const dateObj = new Date(romaData.updated_at);
        const dateStr = dateObj.toLocaleDateString('it-IT') + ' - ' + dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        setMatchState(prev => ({
          ...prev,
          lastUpdate: dateStr,
          date: romaData.details?.match_date || oppData?.details?.match_date || prev.date,
          stadium: romaData.details?.match_stadium || oppData?.details?.match_stadium || prev.stadium,
          homeTeam: teams[0],
          awayTeam: teams[1],
          homeLogo: findLogo(teams[0], prev.homeLogo),
          awayLogo: findLogo(teams[1], prev.awayLogo)
        }));
        
        const formatData = (d: any) => ({
           formation: d?.formation || 'N/A',
           starters: d?.starters || [],
           bench: d?.bench || [],
           details: d?.details || null
        });

        if (isRomaHome) {
          setHomeState(formatData(romaData));
          if (oppData) setAwayState(formatData(oppData));
        } else {
          setAwayState(formatData(romaData));
          if (oppData) setHomeState(formatData(oppData));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLineups();
  }, []);

  return (
    <PullToRefresh onRefresh={fetchLineups}>
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 lg:pb-12">
        <GlobalHeader title="Probabili Formazioni" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Match Header */}
          <div className="flex flex-col items-center justify-center pt-2 pb-1">
            <div className="flex items-center justify-center gap-4 md:gap-8 mb-2">
              <div className="flex items-center gap-2">
                <img src={matchState.homeLogo} alt={matchState.homeTeam} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                <span className={`font-bold text-lg md:text-2xl ${matchState.homeTeam === 'Roma' ? 'text-primary' : 'text-gray-900'}`}>{matchState.homeTeam}</span>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#f0b516] border-2 border-white flex items-center justify-center text-xs font-black text-black shadow-md">VS</div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg md:text-2xl ${matchState.awayTeam === 'Roma' ? 'text-primary' : 'text-gray-900'}`}>{matchState.awayTeam}</span>
                <img src={matchState.awayLogo} alt={matchState.awayTeam} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              </div>
            </div>
            {(matchState.date || matchState.stadium) && (
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {matchState.date && <span>{matchState.date}</span>}
                {matchState.date && matchState.stadium && <span>•</span>}
                {matchState.stadium && <span>{matchState.stadium}</span>}
              </div>
            )}
          </div>

          {/* THE PITCH - TRUE 3D HORIZONTAL */}
          {/* bg-[#15803d] prevents any black corners from showing if the transformed floor doesn't fully cover the box */}
          <div className="relative w-full h-[360px] md:h-[480px] rounded-3xl overflow-hidden shadow-xl bg-[#15803d] border-4 border-card mb-8 flex items-center justify-center" style={{ perspective: '1200px' }}>
            
            {/* The 3D Floor (Contains Grass, Lines AND Players) */}
            <div className="absolute w-full h-full bg-gradient-to-t from-[#15803d] to-[#16a34a] flex [transform:rotateX(20deg)] md:[transform:rotateX(36deg)]" 
                 style={{ transformStyle: 'preserve-3d' }}>
               
               {/* --- FIELD LINES (Pure white #FFFFFF) --- */}
               <div className="absolute inset-2 md:inset-8 border-2 md:border-4 border-white/90 z-0 shadow-sm"></div>
               {/* Center Line */}
               <div className="absolute inset-y-2 md:inset-y-8 left-1/2 border-l-2 md:border-l-4 border-white/90 z-0 shadow-sm"></div>
               {/* Center Circle */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-44 md:h-44 border-2 md:border-4 border-white/90 rounded-full z-0 shadow-sm"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 md:w-3 md:h-3 bg-white rounded-full z-0 shadow-sm"></div>
               
               {/* Left Goal Area */}
               <div className="absolute top-1/4 bottom-1/4 left-2 md:left-8 w-12 md:w-28 border-r-2 md:border-r-4 border-y-2 md:border-y-4 border-white/90 z-0 shadow-sm"></div>
               <div className="absolute top-[38%] bottom-[38%] left-2 md:left-8 w-6 md:w-14 border-r-2 md:border-r-4 border-y-2 md:border-y-4 border-white/90 z-0 shadow-sm"></div>
               <div className="absolute top-[38%] bottom-[38%] left-[54px] md:left-[118px] w-6 md:w-14 border-r-2 md:border-r-4 border-white/90 rounded-r-[100%] z-0 opacity-80"></div>
               
               {/* Right Goal Area */}
               <div className="absolute top-1/4 bottom-1/4 right-2 md:right-8 w-12 md:w-28 border-l-2 md:border-l-4 border-y-2 md:border-y-4 border-white/90 z-0 shadow-sm"></div>
               <div className="absolute top-[38%] bottom-[38%] right-2 md:right-8 w-6 md:w-14 border-l-2 md:border-l-4 border-y-2 md:border-y-4 border-white/90 z-0 shadow-sm"></div>
               <div className="absolute top-[38%] bottom-[38%] right-[54px] md:right-[118px] w-6 md:w-14 border-l-2 md:border-l-4 border-white/90 rounded-l-[100%] z-0 opacity-80"></div>

               {/* --- PLAYERS GRID (On the 3D floor) --- */}
               <div className="absolute inset-1.5 md:inset-6 flex px-0.5 py-1 md:py-6 z-10" style={{ transformStyle: 'preserve-3d' }}>
                 {/* Home (Left) */}
                 <DynamicFormationGrid starters={homeState.starters} formationStr={homeState.formation} />

                 {/* Away (Right) */}
                 <DynamicFormationGrid starters={awayState.starters} formationStr={awayState.formation} isAway />
               </div>
            </div>
          </div>

          {/* TWO COLUMNS LISTS */}
          <div className="grid grid-cols-2 gap-1.5 md:gap-4 mt-6 relative items-start">
            <TeamList teamName={matchState.homeTeam} formation={homeState.formation} players={homeState} isAway={false} />
            <div className="absolute left-1/2 top-[16px] md:top-[18px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#f0b516] border-2 border-white flex items-center justify-center text-[9px] md:text-xs font-black text-black z-20 shadow-md pointer-events-none">VS</div>
            <TeamList teamName={matchState.awayTeam} formation={awayState.formation} players={awayState} isAway={true} />
          </div>
          
          <div className="text-center py-2">
            <span className="inline-block bg-card border border-border text-gray-500 text-[10px] font-mono px-4 py-1.5 rounded-full shadow-sm">
              {lang === 'en' ? 'Last updated:' : 'Ultimo aggiornamento:'} {matchState.lastUpdate}
            </span>
          </div>

          {/* PRESENTAZIONE SQUADRE */}
          <div className="mt-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">{t('lineups.team_intro')}</h2>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div className="bg-white border border-border rounded-xl p-3 md:p-5 shadow-sm">
                <h3 className="text-xs md:text-sm font-bold text-gray-900 mb-1.5">{matchState.homeTeam}</h3>
                <p className="text-[11px] md:text-xs text-gray-700 leading-relaxed">{buildDynamicCommentary(matchState.homeTeam, homeState)}</p>
              </div>
              <div className="bg-white border border-primary/20 rounded-xl p-3 md:p-5 shadow-sm">
                <h3 className="text-xs md:text-sm font-bold text-primary mb-1.5">{matchState.awayTeam}</h3>
                <p className="text-[11px] md:text-xs text-gray-700 leading-relaxed">{buildDynamicCommentary(matchState.awayTeam, awayState)}</p>
              </div>
            </div>
          </div>

          {/* BALLOTTAGGI & DETTAGLI CALCIATORI */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pl-1">{t('lineups.player_details')}</h2>
            
            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-2 divide-x divide-border">
                
                {/* Home Details */}
                <div className="p-2.5 md:p-6">
                  <DynamicDetails details={homeState?.details} color="#3b82f6" />
                </div>

                {/* Away Details */}
                <div className="p-2.5 md:p-6">
                  <DynamicDetails details={awayState?.details} color="#ef4444" />
                </div>

              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </PullToRefresh>
  );
}
