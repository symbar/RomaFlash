const fs = require('fs');

const filepath = 'src/app/formazioni/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const importsToAdd = "import { useState, useEffect } from 'react';\nimport { supabase } from '@/lib/supabase';\n";
content = content.replace("'use client';", "'use client';\n\n" + importsToAdd);

const oldStart = export default function FormazioniPage() {
  return (
    <PullToRefresh onRefresh={async () => await new Promise(r => setTimeout(r, 1000))}>;

const newStart = export default function FormazioniPage() {
  const [matchState, setMatchState] = useState(matchData);
  const [homeState, setHomeState] = useState(homeLineup);
  const [awayState, setAwayState] = useState(awayLineup);
  
  const fetchLineups = async () => {
    try {
      const { data, error } = await supabase
        .from('lineups')
        .select('*')
        .eq('team', 'Roma')
        .single();
        
      if (data && !error) {
        const dateObj = new Date(data.updated_at);
        const dateStr = dateObj.toLocaleDateString('it-IT') + ' - ' + dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        setMatchState(prev => ({
          ...prev,
          lastUpdate: dateStr
        }));
        
        const mappedStarters = data.starters.map((s) => ({
          name: s,
          role: '-',
          prob: 90
        }));

        const isHome = data.match_name.startsWith('Roma');
        
        if (isHome) {
          setHomeState({
            formation: data.formation,
            starters: mappedStarters,
            bench: []
          });
        } else {
          setAwayState({
            formation: data.formation,
            starters: mappedStarters,
            bench: []
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLineups();
  }, []);

  return (
    <PullToRefresh onRefresh={fetchLineups}>;

content = content.replace(oldStart, newStart);

const parts = content.split("export default function FormazioniPage() {");
if(parts.length > 1) {
    let renderPart = parts[1];
    renderPart = renderPart.replace(/matchData\./g, "matchState.");
    renderPart = renderPart.replace(/homeLineup\./g, "homeState.");
    renderPart = renderPart.replace(/homeLineup\}/g, "homeState}");
    renderPart = renderPart.replace(/awayLineup\./g, "awayState.");
    renderPart = renderPart.replace(/awayLineup\}/g, "awayState}");

    content = parts[0] + "export default function FormazioniPage() {" + renderPart;
}

fs.writeFileSync(filepath, content, 'utf8');
