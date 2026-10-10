import Link from 'next/link';
﻿import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ClassificaPage() {
  
  const { data: standings } = await supabase
    .from('standings')
    .select('*')
    .order('position', { ascending: true });

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 pb-32">
      
      <header className="flex items-center justify-between py-6 mb-4 border-b border-border relative z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Classifica <span className="text-primary">Serie A</span></h1>
          </div>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 ml-8 text-sm font-semibold text-gray-500 dark:text-gray-400">
            <Link href="/" className="flex items-center gap-2 hover:text-primary transition-colors text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Le Ultime
            </Link>
            <Link href="/classifica" className="flex items-center gap-2 hover:text-primary transition-colors text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              Classifica
            </Link>
            <Link href="/calendario" className="flex items-center gap-2 hover:text-primary transition-colors text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
              Calendario
            </Link>
          </nav>
        </div>
      </header>


      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg mt-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-black/50 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-3 py-3 font-semibold w-8 text-center">#</th>
              <th className="px-3 py-3 font-semibold">Squadra</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center">G</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center">PT</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center">V</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center">N</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center">P</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center text-gray-500">DR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {standings?.map((team) => (
              <tr key={team.id} className={`${team.team_name.includes('Roma') && !team.team_name.includes('Lazio') ? 'bg-primary/10' : 'hover:bg-white/5'}`}>
                <td className="px-3 py-3 text-center font-bold text-gray-400">{team.position}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 relative shrink-0">
                      <img src={team.team_logo} alt={team.team_name} className="object-contain w-full h-full" />
                    </div>
                    <span className={`font-semibold ${team.team_name.includes('Roma') && !team.team_name.includes('Lazio') ? 'text-primary' : 'text-white'}`}>{team.team_name}</span>
                  </div>
                </td>
                <td className="px-1 md:px-2 py-3 text-center text-gray-400">{team.played}</td>
                <td className="px-1 md:px-2 py-3 text-center font-bold text-white">{team.points}</td>
                <td className="px-1 md:px-2 py-3 text-center text-gray-400">{team.won}</td>
                <td className="px-1 md:px-2 py-3 text-center text-gray-400">{team.draw}</td>
                <td className="px-1 md:px-2 py-3 text-center text-gray-400">{team.lost}</td>
                <td className="px-1 md:px-2 py-3 text-center text-gray-500 font-mono">{team.goals_for - team.goals_against > 0 ? '+' : ''}{team.goals_for - team.goals_against}</td>
              </tr>
            ))}
            {!standings || standings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Nessun dato disponibile.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

