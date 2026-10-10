'use client';

import GlobalHeader from '@/components/GlobalHeader';
import PullToRefresh from '@/components/PullToRefresh';
import { motion } from 'framer-motion';

// --- MOCK DATA ---
const matchData = {
  homeTeam: "Como",
  homeLogo: "https://media.api-sports.io/football/teams/853.png",
  awayTeam: "Roma",
  awayLogo: "https://media.api-sports.io/football/teams/497.png",
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
    <div className="w-12 md:w-16 h-1.5 bg-white/10 rounded-full overflow-hidden flex-shrink-0">
      <div className={`h-full ${getColor()} rounded-full`} style={{ width: `${prob}%` }} />
    </div>
  );
}

function PlayerRow({ player, isAway }: { player: any, isAway: boolean }) {
  const RoleIcon = () => (
    <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white shrink-0
      ${player.role === 'P' ? 'bg-yellow-600' : 
        player.role === 'D' ? 'bg-green-600' : 
        player.role === 'C' ? 'bg-blue-600' : 
        player.role === 'A' ? 'bg-red-600' : 'bg-gray-600'}`}>
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
        <ProgressBar prob={player.prob} />
        <span className="text-xs font-mono text-gray-500 w-8 text-center">{player.prob}%</span>
      </div>
    </div>
  );
}

function TeamList({ teamName, formation, players, isAway }: { teamName: string, formation: string, players: any, isAway: boolean }) {
  return (
    <div className="flex-1 bg-card/40 border border-border rounded-xl overflow-hidden backdrop-blur-sm">
      {/* Header List */}
      <div className={`px-4 py-2 flex justify-between items-center ${isAway ? 'bg-primary/20 border-b border-primary/30' : 'bg-black/40 border-b border-border'}`}>
        <span className={`font-bold text-sm ${isAway ? 'text-primary' : 'text-white'}`}>{teamName}</span>
        <span className="text-xs font-mono text-gray-400 font-bold">{formation}</span>
      </div>
      
      {/* Starters */}
      <div className="p-3">
        {players.starters.map((p: any, i: number) => (
          <PlayerRow key={i} player={p} isAway={isAway} />
        ))}
      </div>

      {/* Bench */}
      <div className="bg-black/20 px-4 py-2 border-y border-border text-center">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Panchina</span>
      </div>
      <div className="p-3 opacity-70">
        {players.bench.map((p: any, i: number) => (
          <PlayerRow key={i} player={p} isAway={isAway} />
        ))}
      </div>
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
          <div className="flex flex-col items-center text-center space-y-2 mb-8 mt-4">
            <div className="flex items-center justify-center gap-4 md:gap-8">
              <div className="flex flex-col items-center gap-2">
                <img src={matchData.homeLogo} alt={matchData.homeTeam} className="w-14 h-14 md:w-20 md:h-20 drop-shadow-lg" />
                <span className="font-bold text-lg md:text-xl">{matchData.homeTeam}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-gray-600">VS</div>
              <div className="flex flex-col items-center gap-2">
                <img src={matchData.awayLogo} alt={matchData.awayTeam} className="w-14 h-14 md:w-20 md:h-20 drop-shadow-lg" />
                <span className="font-bold text-lg md:text-xl text-primary">{matchData.awayTeam}</span>
              </div>
            </div>
            <div className="text-xs md:text-sm font-semibold text-gray-400 mt-4">
              {matchData.date} <span className="mx-2">•</span> {matchData.stadium}
            </div>
          </div>

          {/* LAST UPDATE */}
          <div className="text-center pb-4">
            <span className="inline-block bg-black/40 border border-border text-gray-400 text-[10px] uppercase font-bold tracking-widest px-4 py-1.5 rounded-full">
              Ultimo aggiornamento: {matchData.lastUpdate}
            </span>
          </div>

          {/* TWO COLUMNS LISTS */}
          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <TeamList teamName={matchData.homeTeam} formation={homeLineup.formation} players={homeLineup} isAway={false} />
            <TeamList teamName={matchData.awayTeam} formation={awayLineup.formation} players={awayLineup} isAway={true} />
          </div>
          
          {/* PRESENTAZIONE SQUADRE (AI Text) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-card/30 border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <img src={matchData.homeLogo} className="w-5 h-5" /> Analisi {matchData.homeTeam}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">{analysis.home}</p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <img src={matchData.awayLogo} className="w-5 h-5" /> Analisi {matchData.awayTeam}
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">{analysis.away}</p>
            </div>
          </div>

          {/* BALLOTTAGGI & DETTAGLI CALCIATORI */}
          <div className="mt-8 bg-card/50 border border-border rounded-2xl p-6">
            <h2 className="text-center text-lg font-bold text-white mb-6 uppercase tracking-widest">Dettaglio Calciatori</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-border">
              {/* Home Details */}
              <div className="space-y-6 pt-4 md:pt-0 pr-0 md:pr-4">
                <div className="text-center">
                  <span className="bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Ballottaggi</span>
                </div>
                <div className="flex items-center justify-center gap-4 bg-black/20 p-3 rounded-lg border border-border">
                  {/* Fake Donut Chart */}
                  <div className="relative w-12 h-12 rounded-full border-4 border-orange-500/30">
                    <div className="absolute inset-[-4px] rounded-full border-4 border-orange-500 border-r-transparent border-b-transparent transform rotate-45"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">60%</div>
                  </div>
                  <div>
                    <div className="flex justify-between w-32 mb-1"><span className="text-sm font-bold text-white">Paz</span></div>
                    <div className="flex justify-between w-32"><span className="text-sm text-gray-400">Fadera</span></div>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <span className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Infortunati</span>
                </div>
                <div className="text-center text-sm text-gray-400 bg-black/20 p-3 rounded-lg border border-border">
                  <span className="font-bold text-white">Varane</span><br/>Problema al ginocchio, out.
                </div>
              </div>

              {/* Away Details */}
              <div className="space-y-6 pt-6 md:pt-0 pl-0 md:pl-4">
                <div className="text-center">
                  <span className="bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Ballottaggi</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-center gap-4 bg-black/20 p-3 rounded-lg border border-primary/20">
                    <div className="relative w-12 h-12 rounded-full border-4 border-orange-500/30">
                      <div className="absolute inset-[-4px] rounded-full border-4 border-orange-500 border-r-transparent border-b-transparent transform rotate-12"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">55%</div>
                    </div>
                    <div>
                      <div className="flex justify-between w-32 mb-1"><span className="text-sm font-bold text-white">Dybala</span></div>
                      <div className="flex justify-between w-32"><span className="text-sm text-gray-400">Soulé</span></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 bg-black/20 p-3 rounded-lg border border-primary/20">
                    <div className="relative w-12 h-12 rounded-full border-4 border-green-500/30">
                      <div className="absolute inset-[-4px] rounded-full border-4 border-green-500 border-b-transparent transform rotate-45"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">60%</div>
                    </div>
                    <div>
                      <div className="flex justify-between w-32 mb-1"><span className="text-sm font-bold text-white">Hermoso</span></div>
                      <div className="flex justify-between w-32"><span className="text-sm text-gray-400">Hummels</span></div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <span className="bg-orange-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Infortunati</span>
                </div>
                <div className="text-center text-sm text-gray-400 bg-black/20 p-3 rounded-lg border border-border">
                  <span className="font-bold text-white">Saelemaekers</span><br/>Frattura al malleolo, rientro a Novembre.
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </PullToRefresh>
  );
}
