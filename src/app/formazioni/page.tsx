
'use client';

import GlobalHeader from '@/components/GlobalHeader';
import PullToRefresh from '@/components/PullToRefresh';
import { motion } from 'framer-motion';

// --- MOCK DATA ---
const matchData = {
  homeTeam: "Como",
  homeLogo: "https://upload.wikimedia.org/wikipedia/it/thumb/a/a2/Como_1907_logo.svg/120px-Como_1907_logo.svg.png",
  awayTeam: "Roma",
  awayLogo: "https://upload.wikimedia.org/wikipedia/it/thumb/1/1c/AS_Roma_logo_%282017%29.svg/120px-AS_Roma_logo_%282017%29.svg.png",
  date: "Domenica 11 Ottobre, 12:30",
  stadium: "Giuseppe Sinigaglia",
  lastUpdate: "10/10/2026 - 19:04"
};

const homeLineup = {
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

const awayLineup = {
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
    return 'bg-gray-500';
  };
  
  return (
    <div className="w-16 h-1.5 bg-[#1e2a3b] rounded-full overflow-hidden flex-shrink-0">
      <div className={`h-full ${getColor()} rounded-full`} style={{ width: `${prob}%` }} />
    </div>
  );
}

function PlayerRow({ player, isAway }: { player: any, isAway: boolean }) {
  const RoleIcon = () => (
    <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white shrink-0
      ${player.role === 'P' ? 'bg-yellow-500' : 
        player.role === 'D' ? 'bg-green-500' : 
        player.role === 'C' ? 'bg-blue-500' : 
        player.role === 'A' ? 'bg-red-500' : 'bg-gray-600'}`}>
      {player.role || '-'}
    </span>
  );

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-1">
      <div className={`flex items-center gap-2 ${isAway ? 'order-2 flex-row-reverse text-right' : 'order-1'}`}>
        <RoleIcon />
        <span className={`font-semibold text-sm ${player.ballottaggio ? 'text-white' : 'text-gray-300'}`}>
          {player.name}
        </span>
      </div>
      <div className={`flex items-center gap-2 ${isAway ? 'order-1' : 'order-2'}`}>
        <span className="text-xs font-mono text-gray-500 w-8 text-center">{player.prob}%</span>
        <ProgressBar prob={player.prob} />
      </div>
    </div>
  );
}

function TeamList({ teamName, formation, players, isAway }: { teamName: string, formation: string, players: any, isAway: boolean }) {
  return (
    <div className="flex-1 bg-[#151c27] border border-[#2a364a] rounded-xl overflow-hidden shadow-lg">
      <div className="bg-[#1e2a3b] px-4 py-2 border-b border-[#2a364a] flex justify-between items-center">
        <span className="font-bold text-sm text-white">{teamName}</span>
        <span className="text-xs font-mono text-gray-400 font-bold">{formation}</span>
      </div>
      <div className="p-3">
        {players.starters.map((p: any, i: number) => (
          <PlayerRow key={i} player={p} isAway={isAway} />
        ))}
      </div>
      <div className="bg-[#1e2a3b] px-4 py-2 border-y border-[#2a364a] text-center">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-[#151c27] px-3 py-1 rounded-full border border-[#2a364a]">Panchina</span>
      </div>
      <div className="p-3 opacity-70">
        {players.bench.map((p: any, i: number) => (
          <PlayerRow key={i} player={p} isAway={isAway} />
        ))}
      </div>
    </div>
  );
}

function PlayerDot({ name, ballottaggio }: { name: string, ballottaggio?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className={`w-8 h-8 rounded-full border-2 shadow-lg flex items-center justify-center overflow-hidden
        ${ballottaggio ? 'border-orange-500 border-dashed animate-pulse' : 'border-gray-300'} bg-gray-800`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/>
        </svg>
      </div>
      <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm whitespace-nowrap shadow-sm">
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
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="#1e2a3b" strokeWidth={strokeWidth} />
        <circle 
          cx={size/2} cy={size/2} r={radius} fill="transparent" stroke={color} strokeWidth={strokeWidth} 
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" 
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-white">{prob}%</span>
    </div>
  );
}

export default function FormazioniPage() {
  return (
    <PullToRefresh onRefresh={async () => await new Promise(r => setTimeout(r, 1000))}>
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32">
        <GlobalHeader title="Probabili Formazioni" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Match Header */}
          <div className="flex flex-col items-center justify-center pt-4">
            <div className="flex items-center justify-center gap-6 md:gap-16">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg md:text-xl text-white">{matchData.homeTeam}</span>
                <img src={matchData.homeLogo} alt={matchData.homeTeam} className="w-10 h-10 md:w-12 md:h-12 object-contain" />
              </div>
              <div className="text-xl font-bold text-gray-500">VS</div>
              <div className="flex items-center gap-3">
                <img src={matchData.awayLogo} alt={matchData.awayTeam} className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                <span className="font-bold text-lg md:text-xl text-white">{matchData.awayTeam}</span>
              </div>
            </div>
          </div>

          {/* THE PITCH - Fantacalcio Style */}
          <div className="w-full rounded-2xl bg-gradient-to-b from-[#1c2c42] to-[#0f172a] border border-[#2a364a] shadow-2xl relative overflow-hidden flex flex-col py-6 pb-2" style={{ perspective: '1000px' }}>
             
             {/* Pitch Lines */}
             <div className="absolute inset-x-8 top-12 bottom-12 border-2 border-white/10 rounded-sm pointer-events-none transform rotateX-[30deg]"></div>
             <div className="absolute inset-x-0 top-1/2 border-t-2 border-white/10 pointer-events-none transform rotateX-[30deg]"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/10 rounded-full pointer-events-none transform rotateX-[30deg] scale-y-75"></div>
             
             {/* AWAY TEAM (Roma) - Top Half */}
             <div className="w-full flex justify-center gap-4 z-10 mt-2">
                <PlayerDot name="Dovbyk" />
             </div>
             <div className="w-full flex justify-center gap-12 z-10 mt-6">
                <PlayerDot name="Pellegrini" />
                <PlayerDot name="Dybala" ballottaggio />
             </div>
             <div className="w-full flex justify-center gap-8 z-10 mt-8">
                <PlayerDot name="Angelino" />
                <PlayerDot name="Cristante" />
                <PlayerDot name="Kone" />
                <PlayerDot name="Celik" />
             </div>
             <div className="w-full flex justify-center gap-16 z-10 mt-8">
                <PlayerDot name="Ndicka" />
                <PlayerDot name="Hermoso" ballottaggio />
                <PlayerDot name="Mancini" />
             </div>
             <div className="w-full flex justify-center gap-4 z-10 mt-6 border-b border-white/5 pb-4">
                <PlayerDot name="Svilar" />
             </div>
             
             {/* Info Bar */}
             <div className="flex justify-between items-center w-full px-4 pt-2 mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
               <span>{matchData.date}</span>
               <span>{matchData.stadium}</span>
             </div>
          </div>

          {/* TWO COLUMNS LISTS */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <TeamList teamName={matchData.homeTeam} formation={homeLineup.formation} players={homeLineup} isAway={false} />
            <TeamList teamName={matchData.awayTeam} formation={awayLineup.formation} players={awayLineup} isAway={true} />
          </div>
          
          <div className="text-center py-2">
            <span className="inline-block bg-[#151c27] border border-[#2a364a] text-gray-400 text-[10px] font-mono px-4 py-1.5 rounded-full shadow-lg">
              Ultimo aggiornamento: {matchData.lastUpdate}
            </span>
          </div>

          {/* PRESENTAZIONE SQUADRE (AI Text) */}
          <div className="mt-2">
            <h2 className="text-lg font-bold text-white mb-4 pl-1">Presentazione squadre</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#151c27] border border-[#2a364a] rounded-xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-2">{matchData.homeTeam}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{analysis.home}</p>
              </div>
              <div className="bg-[#151c27] border border-[#2a364a] rounded-xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-2">{matchData.awayTeam}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{analysis.away}</p>
              </div>
            </div>
          </div>

          {/* BALLOTTAGGI & DETTAGLI CALCIATORI */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-white mb-4 pl-1">Dettaglio calciatori</h2>
            
            <div className="bg-[#151c27] border border-[#2a364a] rounded-xl overflow-hidden shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#2a364a]">
                
                {/* Home Details */}
                <div className="p-6">
                  {/* Ballottaggi */}
                  <div className="flex justify-center mb-6">
                    <span className="bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Ballottaggi</span>
                  </div>
                  <div className="flex items-center gap-4 mb-8">
                    <DonutChart prob={60} color="#8b5cf6" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1"><span className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Paz</span><span className="text-xs font-bold text-white">60%</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-gray-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 opacity-50"></div>Fadera</span><span className="text-xs font-bold text-gray-400">40%</span></div>
                    </div>
                  </div>

                  {/* Squalificati */}
                  <div className="flex justify-center mb-4 mt-8">
                    <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Squalificati</span>
                  </div>
                  <div className="text-center text-xs text-gray-500 mb-8">Nessun calciatore</div>

                  {/* Diffidati */}
                  <div className="flex justify-center mb-4">
                    <span className="bg-yellow-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Diffidati</span>
                  </div>
                  <div className="text-center text-xs text-gray-500 mb-8">Nessun calciatore</div>

                  {/* Infortunati */}
                  <div className="flex justify-center mb-4">
                    <span className="bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Infortunati</span>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-bold text-white mb-1">Varane</div>
                    <div className="text-xs text-gray-400">Problema al ginocchio, out.</div>
                  </div>
                </div>

                {/* Away Details */}
                <div className="p-6">
                  {/* Ballottaggi */}
                  <div className="flex justify-center mb-6">
                    <span className="bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Ballottaggi</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <DonutChart prob={55} color="#8b5cf6" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1"><span className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div>Dybala</span><span className="text-xs font-bold text-white">55%</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-gray-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 opacity-50"></div>Soulé</span><span className="text-xs font-bold text-gray-400">45%</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <DonutChart prob={60} color="#8b5cf6" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1"><span className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div>Hermoso</span><span className="text-xs font-bold text-white">60%</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-gray-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 opacity-50"></div>Hummels</span><span className="text-xs font-bold text-gray-400">40%</span></div>
                    </div>
                  </div>

                  {/* Squalificati */}
                  <div className="flex justify-center mb-4 mt-8">
                    <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Squalificati</span>
                  </div>
                  <div className="text-center text-xs text-gray-500 mb-8">Nessun calciatore</div>

                  {/* Diffidati */}
                  <div className="flex justify-center mb-4">
                    <span className="bg-yellow-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Diffidati</span>
                  </div>
                  <div className="text-center text-xs text-gray-500 mb-8">Nessun calciatore</div>

                  {/* Infortunati */}
                  <div className="flex justify-center mb-4">
                    <span className="bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Infortunati</span>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-bold text-white mb-1">Saelemaekers</div>
                    <div className="text-xs text-gray-400">Frattura al malleolo, rientro a Novembre.</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </PullToRefresh>
  );
}
