"use client";

import { useEffect, useState } from 'react';
import GlobalHeader from '@/components/GlobalHeader';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/LanguageContext';

export default function ClassificaPage() {
  const { lang, t } = useLanguage();
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      const { data } = await supabase
        .from('standings')
        .select('*')
        .order('position', { ascending: true });
      if (data) setStandings(data);
      setLoading(false);
    };
    fetchStandings();
  }, []);

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 pb-32">
      <GlobalHeader title="Classifica Serie A" />

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm mt-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-3 py-3 font-semibold w-8 text-center">#</th>
              <th className="px-3 py-3 font-semibold">{t('standings.team')}</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center text-gray-900 font-extrabold">PT</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center">{lang === 'en' ? 'P' : 'G'}</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center">{lang === 'en' ? 'W' : 'V'}</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center">{lang === 'en' ? 'D' : 'N'}</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center">{lang === 'en' ? 'L' : 'P'}</th>
              <th className="px-1 md:px-2 py-3 font-semibold text-center text-gray-500">{lang === 'en' ? 'GD' : 'DR'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {standings?.map((team) => (
              <tr key={team.id} className={`${team.team_name.includes('Roma') && !team.team_name.includes('Lazio') ? 'bg-primary/10' : 'hover:bg-gray-50'}`}>
                <td className="px-3 py-3 text-center font-bold text-gray-500">{team.position}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 relative shrink-0">
                      <img src={team.team_logo} alt={team.team_name} className="object-contain w-full h-full" />
                    </div>
                    <span className={`font-semibold ${team.team_name.includes('Roma') && !team.team_name.includes('Lazio') ? 'text-primary' : 'text-gray-900'}`}>{team.team_name}</span>
                  </div>
                </td>
                <td className="px-1 md:px-2 py-3 text-center font-bold text-gray-900">{team.points}</td>
                <td className="px-1 md:px-2 py-3 text-center text-gray-600">{team.played}</td>
                <td className="px-1 md:px-2 py-3 text-center text-gray-600">{team.won}</td>
                <td className="px-1 md:px-2 py-3 text-center text-gray-600">{team.draw}</td>
                <td className="px-1 md:px-2 py-3 text-center text-gray-600">{team.lost}</td>
                <td className="px-1 md:px-2 py-3 text-center text-gray-500 font-mono">{team.goals_for - team.goals_against > 0 ? '+' : ''}{team.goals_for - team.goals_against}</td>
              </tr>
            ))}
            {!loading && standings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {t('standings.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
