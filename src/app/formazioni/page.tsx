
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

import GlobalHeader from '@/components/GlobalHeader';
import PullToRefresh from '@/components/PullToRefresh';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';

// --- MOCK DATA ---
const matchData = {
  homeTeam: "Como",
  homeLogo: "https://crests.football-data.org/7397.png",
  awayTeam: "Roma",
  awayLogo: "https://crests.football-data.org/100.png",
  date: "Domenica 11 Ottobre, 12:30",
  stadium: "Giuseppe Sinigaglia",
  lastUpdate: "10/10/2026 - 19:04"
};

const homeState = {
  formation: "4-2-3-1",
  starters: [
    { name: "Audero", role: "P", prob: 95 },
    { name: "Iovine", role: "D", prob: 90 },
    { name: "Kempf", role: "D", prob: 90 },
    { name: "Dossena", role: "D", prob: 85 },
    { name: "Moreno", role: "D", prob: 80 },
    { name: "Perrone", role: "C", prob: 85 },
    { name: "Sergi Roberto", role: "C", prob: 90 },
    { name: "Strefezza", role: "C", prob: 95 },
    { name: "Paz", role: "C", prob: 60, ballottaggio: true },
    { name: "Fadera", role: "C", prob: 55, ballottaggio: true },
    { name: "Cutrone", role: "A", prob: 90 },
  ],
  bench: [
    { name: "Reina", prob: 5 },
    { name: "Goldaniga", prob: 10 },
    { name: "Sala", prob: 15 },
    { name: "Engelhardt", prob: 20 },
    { name: "Baselli", prob: 30 },
    { name: "Verdi", prob: 40 },
    { name: "Gabrielloni", prob: 45 },
    { name: "Belotti", prob: 35 },
  ]
};

const awayState = {
  formation: "3-4-2-1",
  starters: [
    { name: "Svilar", role: "P", prob: 99 },
    { name: "Mancini", role: "D", prob: 90 },
    { name: "Ndicka", role: "D", prob: 85 },
    { name: "Hermoso", role: "D", prob: 60, ballottaggio: true },
    { name: "Celik", role: "C", prob: 90 },
    { name: "Cristante", role: "C", prob: 70 },
    { name: "Kone", role: "C", prob: 85 },
    { name: "Angelino", role: "C", prob: 90 },
    { name: "Dybala", role: "A", prob: 55, ballottaggio: true },
    { name: "Pellegrini", role: "A", prob: 80 },
    { name: "Dovbyk", role: "A", prob: 95 },
  ],
  bench: [
    { name: "Ryan", prob: 1 },
    { name: "Hummels", prob: 40 },
    { name: "Abdulhamid", prob: 10 },
    { name: "Dahl", prob: 5 },
    { name: "Le Fée", prob: 30 },
    { name: "Pisilli", prob: 45 },
    { name: "Baldanzi", prob: 40 },
    { name: "Soulé", prob: 45 },
    { name: "Shomurodov", prob: 15 },
  ]
};

const analysis = {
  home: "Nel Como mister Fabregas si affida all'esperienza di Sergi Roberto in mezzo al campo. In attacco fiducia a Cutrone, mentre sulla trequarti c'è un serrato ballottaggio tra Paz e Fadera, con il primo leggermente favorito per una maglia da titolare.",
  away: "Per i giallorossi, De Rossi dovrebbe confermare il 3-4-2-1. In difesa Hermoso è in leggero vantaggio su Hummels per una maglia dal primo minuto. Il vero nodo è in attacco: Dybala non è al 100% e c'è un forte testa a testa con Soulé per affiancare Pellegrini dietro a Dovbyk."
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


function DynamicFormationGrid({ starters, formationStr, isAway }: { starters: any[], formationStr: string, isAway?: boolean }) {
  const pattern = [1, ...formationStr.split('-').map(Number)];
  let currentIndex = 0;
  const columns = pattern.map(count => {
    const playersInColumn = starters.slice(currentIndex, currentIndex + count);
    currentIndex += count;
    return playersInColumn;
  });

  const colHeight = (count: number) => {
    if (count === 1) return 'h-[70%] justify-center';
    if (count === 2) return 'h-[60%] justify-around';
    if (count === 3) return 'h-[75%] justify-around';
    return 'h-full justify-around';
  };

  return (
    <div className={`flex-1 flex ${isAway ? 'flex-row-reverse pl-2 md:pl-4' : 'pr-2 md:pr-4'} items-center justify-between relative z-10`} style={{ transformStyle: 'preserve-3d' }}>
      {columns.map((colPlayers, colIdx) => (
        <div key={colIdx} className={`flex flex-col w-1/5 ${colHeight(colPlayers.length)}`} style={{ transformStyle: 'preserve-3d' }}>
          {colPlayers.map((player, pIdx) => (
            <PlayerDot key={pIdx} name={player.name || player} isAway={isAway} ballottaggio={player.ballottaggio} />
          ))}
        </div>
      ))}
    </div>
  );
}

function PlayerDot({ name, ballottaggio, isAway }: { name: string, ballottaggio?: boolean, isAway?: boolean }) {
  // -45deg cancels the floor's 45deg rotation for flat legibility
  return (
    <div className="flex flex-col items-center justify-center z-10 w-full" style={{ transform: 'translateZ(15px) rotateX(-45deg)', transformOrigin: 'bottom center' }}>
      <span className="text-[9px] md:text-[13px] font-bold text-white bg-black/85 px-1 py-0.5 md:px-2.5 md:py-0.5 rounded md:rounded-md backdrop-blur-md whitespace-nowrap shadow-lg border border-white/25 max-w-[58px] md:max-w-none truncate block text-center">
        {name}
      </span>
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

export default function FormazioniPage() {
  const { lang, t } = useLanguage();
  const [matchState, setMatchState] = useState(matchData);
  const [homeState, setHomeState] = useState({
    formation: "4-2-3-1",
    bench: [], starters: ["Audero", "Iovine", "Kempf", "Dossena", "Moreno", "Sergi R.", "Perrone", "Strefezza", {name: "Paz", ballottaggio: true}, {name: "Fadera", ballottaggio: true}, "Cutrone"], details: null as any
  });
  const [awayState, setAwayState] = useState({
    formation: "3-4-2-1",
    bench: [], starters: ["Svilar", "Mancini", "Ndicka", {name: "Hermoso", ballottaggio: true}, "Celik", "Cristante", "Kone", "Angelino", {name: "Dybala", ballottaggio: true}, "Pellegrini", "Dovbyk"], details: null as any
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
          <div className="flex flex-col items-center justify-center pt-4">
            <div className="flex items-center justify-center gap-4 md:gap-8">
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
          </div>

          {/* THE PITCH - TRUE 3D HORIZONTAL */}
          {/* bg-[#15803d] prevents any black corners from showing if the transformed floor doesn't fully cover the box */}
          <div className="relative w-full h-[280px] md:h-[460px] rounded-3xl overflow-hidden shadow-xl bg-[#15803d] border-4 border-card mb-8 flex items-center justify-center" style={{ perspective: '1200px' }}>
            
            {/* The 3D Floor (Contains Grass, Lines AND Players) */}
            <div className="absolute w-full h-full bg-gradient-to-t from-[#15803d] to-[#16a34a] flex" 
                 style={{ transform: 'rotateX(45deg) translateY(0%)', transformStyle: 'preserve-3d' }}>
               
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
               <div className="absolute inset-2 md:inset-8 flex px-1 py-1 md:py-8 z-10" style={{ transformStyle: 'preserve-3d' }}>
                 {/* Home (Left) */}
                 <DynamicFormationGrid starters={homeState.starters} formationStr={homeState.formation} />

                 {/* Away (Right) */}
                 <DynamicFormationGrid starters={awayState.starters} formationStr={awayState.formation} isAway />
               </div>
            </div>
            
            {/* Info Bar Overlay (Top Left/Right) */}
            <div className="absolute top-3 left-4 md:top-4 md:left-6 text-[10px] md:text-sm font-bold text-white uppercase tracking-widest drop-shadow-md z-20">
              {matchState.date}
            </div>
            <div className="absolute top-3 right-4 md:top-4 md:right-6 text-[10px] md:text-sm font-bold text-white uppercase tracking-widest drop-shadow-md z-20">
              {matchState.stadium}
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
                <p className="text-[11px] md:text-xs text-gray-700 leading-relaxed">{homeState?.details?.commentary || analysis.home}</p>
              </div>
              <div className="bg-white border border-primary/20 rounded-xl p-3 md:p-5 shadow-sm">
                <h3 className="text-xs md:text-sm font-bold text-primary mb-1.5">{matchState.awayTeam}</h3>
                <p className="text-[11px] md:text-xs text-gray-700 leading-relaxed">{awayState?.details?.commentary || analysis.away}</p>
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
