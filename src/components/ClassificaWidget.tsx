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
        .limit(6); // Show top 6 or maybe we should show full? If it's in the sidebar, maybe top 10 or Roma context. Let's show Top 10 for now.
        
      if (data) {
        setStandings(data.slice(0, 7)); // Just show Top 7 to not make it too tall.
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
          Serie A (Top 7)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-black/50 text-gray-500 uppercase">
            <tr>
              <th className="px-2 py-2 font-semibold w-6 text-center">#</th>
              <th className="px-2 py-2 font-semibold">Squadra</th>
              <th className="px-2 py-2 font-semibold text-center">PT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {standings.map((team) => (
              <tr key={team.id} className={`${team.team_name.includes('Roma') && !team.team_name.includes('Lazio') ? 'bg-primary/10' : 'hover:bg-white/5'}`}>
                <td className="px-2 py-2 text-center font-bold text-gray-500">{team.position}</td>
                <td className="px-2 py-2 flex items-center gap-2">
                  <img src={team.team_logo} alt={team.team_name} className="w-4 h-4 object-contain" />
                  <span className="font-semibold">{team.team_name.substring(0, 12)}</span>
                </td>
                <td className="px-2 py-2 text-center font-bold text-white">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-border bg-black/20 text-center">
        <a href="/classifica" className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider">Vedi classifica completa</a>
      </div>
    </div>
  );
}
