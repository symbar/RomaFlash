import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ClassificaPage() {
  
  const { data: standings } = await supabase
    .from('standings')
    .select('*')
    .order('position', { ascending: true });

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-24">
      <header className="py-6 mb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-white">Classifica <span className="text-primary">Serie A</span></h1>
        <p className="text-gray-400 text-sm mt-1">Aggiornata in tempo reale</p>
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
