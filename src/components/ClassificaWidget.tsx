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
    <div className="rounded-2xl overflow-hidden ring-1 ring-border shadow-sm bg-white mt-6">
      <div className="px-4 py-3 border-b border-border bg-gray-50">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
          <svg viewBox="0 0 100 120" className="w-3.5 h-4 drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0L10 15V50C10 85 50 120 50 120C50 120 90 85 90 50V15L50 0Z" fill="white"/>
            <path d="M10 15L36.6 5.2V115.1C23.3 103.4 10 81.3 10 50V15Z" fill="#009246"/>
            <path d="M36.6 5.2L63.3 0V120C63.3 120 63.3 120 63.3 120L36.6 115.1V5.2Z" fill="#F1F2F1"/>
            <path d="M63.3 0L90 15V50C90 81.3 76.6 103.4 63.3 115.1V0Z" fill="#CE2B37"/>
          </svg>
          Serie A
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-100 text-gray-600 text-[10px] font-bold">
            <tr>
              <th className="px-1 py-2 text-center w-6">#</th>
              <th className="px-1 py-2 text-left">SQUADRA</th>
              <th className="px-1 py-2 text-center w-6 text-gray-900 font-extrabold">PT</th>
              <th className="px-1 py-2 text-center w-6">G</th>
              <th className="px-1 py-2 text-center w-6">V</th>
              <th className="px-1 py-2 text-center w-6">N</th>
              <th className="px-1 py-2 text-center w-6">P</th>
              <th className="px-1 py-2 text-center w-6">DR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-[11px]">
            {standings.map((team) => (
              <tr key={team.id} className={`${team.team_name.includes('Roma') && !team.team_name.includes('Lazio') ? 'bg-primary/10' : 'hover:bg-gray-50'}`}>
                <td className="px-1 py-2 text-center font-bold text-gray-500">{team.position}</td>
                <td className="px-1 py-2">
                  <div className="flex items-center gap-1.5">
                    <img src={team.team_logo} alt={team.team_name} className="w-4 h-4 object-contain shrink-0" />
                    <span className={`font-semibold truncate max-w-[80px] block ${team.team_name.includes('Roma') && !team.team_name.includes('Lazio') ? 'text-primary' : 'text-gray-900'}`}>{team.team_name}</span>
                  </div>
                </td>
                <td className="px-1 py-2 text-center font-bold text-gray-900">{team.points}</td>
                <td className="px-1 py-2 text-center text-gray-600">{team.played}</td>
                <td className="px-1 py-2 text-center text-gray-600">{team.won}</td>
                <td className="px-1 py-2 text-center text-gray-600">{team.draw}</td>
                <td className="px-1 py-2 text-center text-gray-600">{team.lost}</td>
                <td className="px-1 py-2 text-center text-gray-500">{team.goals_for - team.goals_against > 0 ? '+' : ''}{team.goals_for - team.goals_against}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
