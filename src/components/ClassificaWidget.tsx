'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ClassificaWidget() {
  const [standings, setStandings] = useState<any[]>([]);

  useEffect(() => {
    const fetchStandings = async () => {
      const { data } = await supabase
        .from('standings')
        .select('*')
        .order('position', { ascending: true })
        ;

      if (data) {
        setStandings(data); // Just show Top 7 to not make it too tall.
      }
    };
    fetchStandings();
  }, []);

  if (standings.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-border shadow-lg bg-card mt-6">
      <div className="px-4 py-3 border-b border-border bg-black/20">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          Serie A
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
                    <thead className="bg-black/50 text-gray-500 text-[10px] font-bold">
            <tr>
              <th className="px-1 py-2 text-center w-6">#</th>
              <th className="px-1 py-2 text-left">SQUADRA</th>
              <th className="px-1 py-2 text-center w-6 text-white">PT</th>
              <th className="px-1 py-2 text-center w-6">G</th>
              <th className="px-1 py-2 text-center w-6">V</th>
              <th className="px-1 py-2 text-center w-6">N</th>
              <th className="px-1 py-2 text-center w-6">P</th>
              <th className="px-1 py-2 text-center w-6">DR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-[11px]">
            {standings.map((team) => (
              <tr key={team.id} className={`${team.team_name.includes('Roma') && !team.team_name.includes('Lazio') ? 'bg-primary/10' : 'hover:bg-white/5'}`}>
                <td className="px-1 py-2 text-center font-bold text-gray-500">{team.position}</td>
                <td className="px-1 py-2">
                  <div className="flex items-center gap-1.5">
                    <img src={team.team_logo} alt={team.team_name} className="w-4 h-4 object-contain shrink-0" />
                    <span className={`font-semibold truncate max-w-[80px] block ${team.team_name.includes('Roma') && !team.team_name.includes('Lazio') ? 'text-primary' : 'text-white'}`}>{team.team_name}</span>
                  </div>
                </td>
                <td className="px-1 py-2 text-center font-bold text-white">{team.points}</td>
                <td className="px-1 py-2 text-center text-gray-400">{team.played}</td>
                <td className="px-1 py-2 text-center text-gray-400">{team.won}</td>
                <td className="px-1 py-2 text-center text-gray-400">{team.draw}</td>
                <td className="px-1 py-2 text-center text-gray-400">{team.lost}</td>
                <td className="px-1 py-2 text-center text-gray-500">{team.goals_for - team.goals_against > 0 ? '+' : ''}{team.goals_for - team.goals_against}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
