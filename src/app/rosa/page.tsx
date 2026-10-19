"use client";

import { useState, useMemo } from 'react';
import GlobalHeader from '@/components/GlobalHeader';
import { useLanguage } from '@/components/LanguageContext';
import { Search, X, ArrowUpRight, Activity } from 'lucide-react';
import rawSquadStats from '@/data/squad_stats.json';

interface MatchVote {
  matchday: number;
  opponent: string;
  grade: number;
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
    const avgAge = 25.8;
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

  const getRoleBadge = (role: 'P' | 'D' | 'C' | 'A') => {
    switch (role) {
      case 'P': return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'D': return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'C': return 'bg-emerald-500/10 text-emerald-700 border-emerald-300';
      case 'A': return 'bg-[#8E1B23]/10 text-[#8E1B23] border-[#8E1B23]/30 font-bold';
    }
  };

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto p-3 sm:p-6 pb-28 md:pb-16 relative">
      <GlobalHeader title={lang === 'en' ? 'AS Roma Squad' : 'Rosa AS Roma'} />

      {/* Hero Banner Squadra */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a080c] via-slate-900 to-[#120407] border border-[#8E1B23]/30 rounded-2xl p-4 sm:p-6 shadow-xl mb-5 text-white">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[#8E1B23]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#FDB927]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FDB927]">
                Stagione 2026/2027 • AS Roma
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-serif">
              {t('squad.title')}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 max-w-md leading-relaxed">
              {t('squad.subtitle')}
            </p>
          </div>

          {/* Statistiche Sintetiche Roster */}
          <div className="grid grid-cols-4 gap-2 bg-slate-950/70 border border-slate-800/80 p-2 sm:p-2.5 rounded-xl shrink-0">
            <div className="flex flex-col items-center justify-center text-center px-1">
              <span className="text-[9px] uppercase font-semibold text-slate-400">Rosa</span>
              <span className="text-base font-bold text-white font-mono">{statsOverview.totalPlayers}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-1 border-l border-slate-800">
              <span className="text-[9px] uppercase font-semibold text-slate-400">Età Media</span>
              <span className="text-base font-bold text-[#FDB927] font-mono">{statsOverview.avgAge}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-1 border-l border-slate-800">
              <span className="text-[9px] uppercase font-semibold text-slate-400">Gol Tot.</span>
              <span className="text-base font-bold text-white font-mono">{statsOverview.totalGoals}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-1 border-l border-slate-800">
              <span className="text-[9px] uppercase font-semibold text-slate-400">Assist</span>
              <span className="text-base font-bold text-white font-mono">{statsOverview.totalAssists}</span>
            </div>
          </div>
        </div>

        {/* Barra di Ricerca e Filtri Ruolo */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
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

      {/* LISTA A STRISCE ORIZZONTALI (OPZIONE B) */}
      {(['P', 'D', 'C', 'A'] as const).map(role => {
        const players = groupedPlayers[role];
        if (players.length === 0) return null;

        return (
          <section key={role} className="mb-6">
            {/* Header Reparto */}
            <div className="flex items-center justify-between mb-2 px-1 pb-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-sm ${
                  role === 'P' ? 'bg-amber-500' :
                  role === 'D' ? 'bg-blue-600' :
                  role === 'C' ? 'bg-emerald-600' : 'bg-[#8E1B23]'
                }`} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {getRoleLabel(role)}
                </h2>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {players.length} {players.length === 1 ? 'calciatore' : 'calciatori'}
              </span>
            </div>

            {/* Intestazione Colonne Tabella Strisce */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider px-3 py-1 bg-gray-50 border-y border-border/80 rounded-t-lg">
              <span className="flex-1">Calciatore</span>
              <div className="flex items-center gap-3 sm:gap-6 text-center shrink-0">
                <span className="w-7 sm:w-10">Pres.</span>
                <span className="w-8 sm:w-10">{role === 'P' ? 'Gol S.' : 'Gol'}</span>
                <span className="w-8 sm:w-10">{role === 'P' ? 'C. Sh.' : 'Assist'}</span>
                <span className="w-8 sm:w-10">MV</span>
              </div>
            </div>

            {/* Righe Giocatori a Strisce */}
            <div className="flex flex-col divide-y divide-border/60 bg-white border-x border-b border-border rounded-b-lg shadow-xs overflow-hidden">
              {players.map(player => (
                <article
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className="group px-3 py-2 sm:py-2.5 flex items-center justify-between hover:bg-gray-50/80 cursor-pointer transition-colors"
                >
                  {/* Numero di Maglia + Busto Sagoma + Nome e Nazionalità */}
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 pr-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-gray-400 group-hover:text-primary transition-colors w-5 sm:w-6 text-center shrink-0">
                      {player.number > 0 ? player.number : '-'}
                    </span>
                    
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:border-primary/40 transition-colors">
                      <img
                        src={player.imagePath}
                        alt={player.fullName}
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain translate-y-0.5"
                        loading="lazy"
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                          {player.fullName}
                        </span>
                        <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 hidden sm:inline-block ${getRoleBadge(player.role)}`}>
                          {player.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 truncate">
                        {player.nationalities || 'AS Roma'}
                      </span>
                    </div>
                  </div>

                  {/* Metriche Statistiche Orizzontali */}
                  <div className="flex items-center gap-3 sm:gap-6 text-center text-xs font-mono shrink-0">
                    <span className="w-7 sm:w-10 text-gray-700 font-bold">{player.partite}</span>
                    <span className={`w-8 sm:w-10 font-bold ${player.gol > 0 ? 'text-primary' : 'text-gray-400'}`}>
                      {player.gol}
                    </span>
                    <span className={`w-8 sm:w-10 font-bold ${
                      (player.role === 'P' ? player.cleanSheet : player.assist) > 0 ? 'text-gray-900 font-bold' : 'text-gray-400'
                    }`}>
                      {player.role === 'P' ? player.cleanSheet : player.assist}
                    </span>
                    <span className={`w-8 sm:w-10 font-bold ${
                      (player.mv || 0) >= 6.5 ? 'text-emerald-600' :
                      (player.mv || 0) >= 6.0 ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {player.mv ? player.mv.toFixed(2) : '-'}
                    </span>
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
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    selectedPlayer.role === 'P' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    selectedPlayer.role === 'D' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    selectedPlayer.role === 'C' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    'bg-[#8E1B23]/40 text-[#FDB927] border-[#FDB927]/30'
                  }`}>
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
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Altezza: <span className="text-slate-200">{selectedPlayer.height}</span> • Piede: <span className="text-slate-200">{selectedPlayer.foot || 'N/D'}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Griglia Metriche Stagionali */}
            <div className="grid grid-cols-4 gap-2 bg-slate-900 border border-slate-800/80 rounded-xl p-3 text-center mb-4">
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

            {/* Disciplina & Cartellini */}
            <div className="grid grid-cols-2 gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-slate-400">Ammonizioni:</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {selectedPlayer.ammonizioni} 🟨
                </span>
              </div>
              <div className="flex items-center justify-between px-2 border-l border-slate-800">
                <span className="text-xs text-slate-400">Espulsioni:</span>
                <span className="text-sm font-bold text-red-500 font-mono">
                  {selectedPlayer.espulsioni} 🟥
                </span>
              </div>
            </div>

            {/* Ultime 5 Pagelle Ufficiali con Codice Squadra Avversaria */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#FDB927]" />
                  {t('squad.last_votes')}
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedPlayer.matchVotes.length > 0 ? `Ultime ${selectedPlayer.matchVotes.length} a voto` : 'Nessun voto'}
                </span>
              </div>

              {selectedPlayer.matchVotes && selectedPlayer.matchVotes.length > 0 ? (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {selectedPlayer.matchVotes.map(vote => (
                    <div
                      key={vote.matchday}
                      className="flex-1 min-w-[56px] bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center"
                    >
                      {/* Abbreviazione Avversaria */}
                      <span className="text-[10px] uppercase font-bold text-[#FDB927] block mb-0.5 tracking-wider">
                        vs {vote.opponent}
                      </span>
                      <span className={`text-base font-bold font-mono block ${
                        vote.grade >= 7.0 ? 'text-emerald-400' :
                        vote.grade >= 6.0 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {vote.grade}
                      </span>
                      <span className="text-[8.5px] text-slate-500 uppercase font-semibold block mt-0.5">
                        {vote.grade >= 6.0 ? 'Suff.' : 'Insuff.'}
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
