import os

filepath = 'src/app/formazioni/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
imports_to_add = "import { useState, useEffect } from 'react';\nimport { supabase } from '@/lib/supabase';\n"
content = content.replace(\"'use client';\", \"'use client';\n\n\" + imports_to_add)

# Replace component start
old_start = '''export default function FormazioniPage() {
  return (
    <PullToRefresh onRefresh={async () => await new Promise(r => setTimeout(r, 1000))}>'''

new_start = '''export default function FormazioniPage() {
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
    <PullToRefresh onRefresh={fetchLineups}>'''

content = content.replace(old_start, new_start)

# Now we need to replace matchData with matchState IN THE RENDER METHOD ONLY
# A simple way is to split the content at "export default function FormazioniPage() {"
parts = content.split("export default function FormazioniPage() {")
render_part = parts[1]
render_part = render_part.replace("matchData.", "matchState.")
render_part = render_part.replace("homeLineup.", "homeState.")
render_part = render_part.replace("homeLineup}", "homeState}")
render_part = render_part.replace("awayLineup.", "awayState.")
render_part = render_part.replace("awayLineup}", "awayState}")

content = parts[0] + "export default function FormazioniPage() {" + render_part

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
