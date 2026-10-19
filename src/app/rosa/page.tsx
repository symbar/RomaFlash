"use client";

import { useState, useMemo } from 'react';
import GlobalHeader from '@/components/GlobalHeader';
import { useLanguage } from '@/components/LanguageContext';
import { Search, Flame, X, Shield, ArrowUpRight, TrendingUp, Calendar, Activity } from 'lucide-react';
import rawSquadStats from '@/data/squad_stats.json';

interface MatchVote {
  matchday: number;
  grade: number;
  fantaGrade: number;
}

interface PlayerStats {
  id: string;
  name: string;
  fullName: string;
  role: 'P' | 'D' | 'C' | 'A';
  slug: string;
  imagePath: string;
  number: number;
  mv: number | null;
  fm: number | null;
  partite: number;
  gol: number;
  cleanSheet: number;
  assist: number;
  ammonizioni: number;
  espulsioni: number;
  height: string | null;
  birthdate: string | null;
  foot: string | null;
  nationalities: string | null;
  quotazione: number | null;
  fvm: number | null;
  heatIndex: number;
  matchVotes: MatchVote[];
}

const squadData = rawSquadStats as PlayerStats[];

export default function RosaPage() {
  const { lang, t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'P' | 'D' | 'C' | 'A'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);

  // Calcolo statistiche aggregate club
  const statsOverview = useMemo(() => {
    const totalPlayers = squadData.length;
    const avgAge = 25.8; // Calcolata sull'anagrafica
    const totalGoals = squadData.reduce((acc, p) => acc + (p.role !== 'P' ? p.gol : 0), 0);
    const totalAssists = squadData.reduce((acc, p) => acc + p.assist, 0);
    return { totalPlayers, avgAge, totalGoals, totalAssists };
  }, []);

  // Filtro giocatori
  const filteredPlayers = useMemo(() => {
    return squadData.filter(p => {
      const matchRole = selectedRole === 'ALL' || p.role === selectedRole;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery = !query || 
        p.name.toLowerCase().includes(query) || 
        p.fullName.toLowerCase().includes(query) ||
        (p.nationalities && p.nationalities.toLowerCase().includes(query)) ||
        (p.number && p.number.toString() === query);
      return matchRole && matchQuery;
    });
  }, [selectedRole, searchQuery]);

  // Raggruppamento per ruoli ordinati
  const groupedPlayers = useMemo(() => {
    return {
      P: filteredPlayers.filter(p => p.role === 'P'),
      D: filteredPlayers.filter(p => p.role === 'D'),
      C: filteredPlayers.filter(p => p.role === 'C'),
      A: filteredPlayers.filter(p => p.role === 'A'),
    };
  }, [filteredPlayers]);

  const getRoleLabel = (role: 'P' | 'D' | 'C' | 'A') => {
    switch (role) {
      case 'P': return t('squad.goalkeepers');
      case 'D': return t('squad.defenders');
      case 'C': return t('squad.midfielders');
      case 'A': return t('squad.forwards');
    }
  };

  const getRoleColor = (role: 'P' | 'D' | 'C' | 'A') => {
    switch (role) {
      case 'P': return 'bg-amber-500 text-amber-50 border-amber-600/30';
      case 'D': return 'bg-blue-600 text-blue-50 border-blue-700/30';
      case 'C': return 'bg-emerald-600 text-emerald-50 border-emerald-700/30';
      case 'A': return 'bg-[#8E1B23] text-white border-[#8E1B23]/40';
    }
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 lg:pb-16 relative">
      <GlobalHeader title={lang === 'en' ? 'AS Roma Squad' : 'Rosa AS Roma'} />

      {/* Hero Banner Squadra */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a080c] via-slate-900 to-[#120407] border border-[#8E1B23]/30 rounded-2xl p-5 sm:p-7 shadow-xl mb-6 text-white">
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-[#8E1B23]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FDB927] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FDB927]">
                Stagione 2026/2027 • AS Roma
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-serif">
              {t('squad.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              {t('squad.subtitle')}
            </p>
          </div>

          {/* Statistiche Sintetiche Roster */}
          <div className="grid grid-cols-4 gap-2 bg-slate-950/70 border border-slate-800/80 p-2.5 sm:p-3 rounded-xl shrink-0">
            <div className="flex flex-col items-center justify-center text-center px-1">
              <span className="text-[9.5px] uppercase font-semibold text-slate-400">Rosa</span>
              <span className="text-base sm:text-lg font-bold text-white font-mono">{statsOverview.totalPlayers}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-1 border-l border-slate-800">
              <span className="text-[9.5px] uppercase font-semibold text-slate-400">Età Media</span>
              <span className="text-base sm:text-lg font-bold text-[#FDB927] font-mono">{statsOverview.avgAge}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-1 border-l border-slate-800">
              <span className="text-[9.5px] uppercase font-semibold text-slate-400">Gol Tot.</span>
              <span className="text-base sm:text-lg font-bold text-white font-mono">{statsOverview.totalGoals}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-1 border-l border-slate-800">
              <span className="text-[9.5px] uppercase font-semibold text-slate-400">Assist</span>
              <span className="text-base sm:text-lg font-bold text-white font-mono">{statsOverview.totalAssists}</span>
            </div>
          </div>
        </div>

        {/* Barra di Ricerca e Filtri Ruolo */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('squad.search_placeholder')}
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FDB927] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Pulsanti Filtro Reparto */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide text-xs">
            <button
              onClick={() => setSelectedRole('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                selectedRole === 'ALL'
                  ? 'bg-[#8E1B23] text-white shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {t('squad.all')} ({squadData.length})
            </button>
            {(['P', 'D', 'C', 'A'] as const).map(role => {
              const count = squadData.filter(p => p.role === role).length;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedRole === role
                      ? 'bg-[#8E1B23] text-white font-bold shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {getRoleLabel(role)} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Griglia Reparti */}
      {(['P', 'D', 'C', 'A'] as const).map(role => {
        const players = groupedPlayers[role];
        if (players.length === 0) return null;

        return (
          <section key={role} className="mb-8">
            <div className="flex items-center justify-between mb-3.5 px-1 border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-sm ${
                  role === 'P' ? 'bg-amber-500' :
                  role === 'D' ? 'bg-blue-600' :
                  role === 'C' ? 'bg-emerald-600' : 'bg-[#8E1B23]'
                }`} />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {getRoleLabel(role)}
                </h2>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {players.length} {players.length === 1 ? 'calciatore' : 'calciatori'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {players.map(player => (
                <article
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className="group relative bg-white border border-border/80 hover:border-[#8E1B23]/70 rounded-2xl p-4 transition-all duration-200 hover:shadow-lg cursor-pointer overflow-hidden flex flex-col justify-between"
                >
                  {/* Numero di Maglia in Filigrana */}
                  {player.number > 0 && (
                    <div className="absolute top-1 right-2 font-mono font-bold text-5xl text-gray-100 select-none group-hover:text-[#FDB927]/15 transition-colors pointer-events-none">
                      {player.number}
                    </div>
                  )}

                  {/* Header Card Giocatore */}
                  <div className="flex items-start justify-between relative z-10 mb-2">
                    <div className="min-w-0 pr-2">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider mb-1 ${getRoleColor(player.role)}`}>
                        {player.role === 'P' ? 'Portiere' :
                         player.role === 'D' ? 'Difensore' :
                         player.role === 'C' ? 'Centrocampista' : 'Attaccante'}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                        {player.fullName}
                      </h3>
                      <p className="text-[11px] text-gray-500 truncate">
                        {player.nationalities || 'AS Roma'}
                      </p>
                    </div>

                    {/* Forma / Heat Index */}
                    <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold" title="Indice Forma">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {player.heatIndex}
                    </div>
                  </div>

                  {/* Sagoma Trasparente Giocatore */}
                  <div className="h-32 flex items-center justify-center my-1 relative">
                    <img
                      src={player.imagePath}
                      alt={player.fullName}
                      className="max-h-32 object-contain drop-shadow-md group-hover:scale-105 group-hover:-translate-y-1 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Matrice Statistiche Rapide */}
                  <div className="grid grid-cols-4 gap-1 bg-gray-50/90 border border-gray-200/80 rounded-xl p-2 text-center relative z-10 mt-2">
                    <div>
                      <span className="text-[8.5px] uppercase text-gray-400 block font-semibold">Pres.</span>
                      <span className="text-xs font-bold text-gray-800 font-mono">{player.partite}</span>
                    </div>
                    <div>
                      <span className="text-[8.5px] uppercase text-gray-400 block font-semibold">
                        {player.role === 'P' ? 'Gol Sub.' : 'Gol'}
                      </span>
                      <span className="text-xs font-bold text-primary font-mono">{player.gol}</span>
                    </div>
                    <div>
                      <span className="text-[8.5px] uppercase text-gray-400 block font-semibold">
                        {player.role === 'P' ? 'C. Sheet' : 'Assist'}
                      </span>
                      <span className="text-xs font-bold text-gray-800 font-mono">
                        {player.role === 'P' ? player.cleanSheet : player.assist}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8.5px] uppercase text-gray-400 block font-semibold">MV</span>
                      <span className={`text-xs font-bold font-mono ${
                        (player.mv || 0) >= 6.5 ? 'text-emerald-600' :
                        (player.mv || 0) >= 6.0 ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {player.mv ? player.mv.toFixed(2) : '-'}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {/* MODAL DETTAGLIATA SCHEDA CALCIATORE */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="relative w-full max-w-lg bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pulsante Chiusura */}
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Hero del Giocatore */}
            <div className="flex items-start gap-4 mb-4">
              <div className="relative w-24 h-28 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                {selectedPlayer.number > 0 && (
                  <span className="absolute -bottom-2 -right-1 font-mono text-5xl font-bold text-slate-800/60 select-none">
                    {selectedPlayer.number}
                  </span>
                )}
                <img
                  src={selectedPlayer.imagePath}
                  alt={selectedPlayer.fullName}
                  className="max-h-24 object-contain relative z-10 drop-shadow-lg"
                />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getRoleColor(selectedPlayer.role)}`}>
                    {selectedPlayer.role === 'P' ? 'Portiere' :
                     selectedPlayer.role === 'D' ? 'Difensore' :
                     selectedPlayer.role === 'C' ? 'Centrocampista' : 'Attaccante'}
                  </span>
                  {selectedPlayer.number > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-[#FDB927] border border-slate-700">
                      #{selectedPlayer.number}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight truncate">
                  {selectedPlayer.fullName}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedPlayer.nationalities || 'AS Roma'} {selectedPlayer.birthdate ? `• Nato il ${selectedPlayer.birthdate}` : ''}
                </p>
                {selectedPlayer.height && (
                  <p className="text-[11px] text-slate-400">
                    Altezza: <span className="text-slate-200">{selectedPlayer.height}</span> • Piede: <span className="text-slate-200">{selectedPlayer.foot || 'N/D'}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Griglia Metriche Stagionali */}
            <div className="grid grid-cols-4 gap-2 bg-slate-900 border border-slate-800/80 rounded-xl p-3 text-center mb-5">
              <div>
                <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">Presenze</span>
                <span className="text-base font-bold text-white font-mono">{selectedPlayer.partite}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">
                  {selectedPlayer.role === 'P' ? 'Gol Subiti' : 'Gol'}
                </span>
                <span className="text-base font-bold text-[#FDB927] font-mono">{selectedPlayer.gol}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">
                  {selectedPlayer.role === 'P' ? 'Clean Sheet' : 'Assist'}
                </span>
                <span className="text-base font-bold text-white font-mono">
                  {selectedPlayer.role === 'P' ? selectedPlayer.cleanSheet : selectedPlayer.assist}
                </span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">Media Voto</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {selectedPlayer.mv ? selectedPlayer.mv.toFixed(2) : '-'}
                </span>
              </div>
            </div>

            {/* FantaValore e Quotazione */}
            <div className="grid grid-cols-2 gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 mb-5">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-slate-400">FantaMedia:</span>
                <span className="text-sm font-bold text-[#FDB927] font-mono">
                  {selectedPlayer.fm ? selectedPlayer.fm.toFixed(2) : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between px-2 border-l border-slate-800">
                <span className="text-xs text-slate-400">Quotazione Classic:</span>
                <span className="text-sm font-bold text-white font-mono">
                  {selectedPlayer.quotazione ? `${selectedPlayer.quotazione} crediti` : '-'}
                </span>
              </div>
            </div>

            {/* Ultime 5 Pagelle / Voti */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#FDB927]" />
                  {t('squad.last_votes')}
                </span>
                <span className="text-[11px] font-bold text-emerald-400">
                  Forma: {selectedPlayer.heatIndex}/100
                </span>
              </div>

              {selectedPlayer.matchVotes && selectedPlayer.matchVotes.length > 0 ? (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {selectedPlayer.matchVotes.map(vote => (
                    <div
                      key={vote.matchday}
                      className="flex-1 min-w-[56px] bg-slate-900 border border-slate-800 rounded-xl p-2 text-center"
                    >
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        G{vote.matchday}
                      </span>
                      <span className={`text-sm font-bold font-mono block my-0.5 ${
                        vote.grade >= 7.0 ? 'text-emerald-400' :
                        vote.grade >= 6.0 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {vote.grade}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        FV {vote.fantaGrade}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-slate-900/40 border border-slate-800/60 rounded-xl text-xs text-slate-400">
                  Nessun voto a referto nelle ultime giornate
                </div>
              )}
            </div>

            {/* Collegamento al feed notizie */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <a
                href={`/?q=${encodeURIComponent(selectedPlayer.name)}`}
                className="text-xs text-[#FDB927] hover:underline font-semibold flex items-center gap-1"
              >
                {t('squad.related_news')} {selectedPlayer.name}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                {t('squad.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
