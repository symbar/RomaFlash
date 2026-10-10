const fs = require('fs');
let code = fs.readFileSync('src/app/formazioni/page.tsx', 'utf8');

code = code.replace(/setHomeState\(\{ formation: formatData\.formation, starters: formatData\.starters, bench: formatData\.bench \}\);/g, 'setHomeState({ formation: formatData.formation, starters: formatData.starters, bench: formatData.bench, details: null as any });');
code = code.replace(/setAwayState\(\{ formation: formatData\.formation, starters: formatData\.starters, bench: formatData\.bench \}\);/g, 'setAwayState({ formation: formatData.formation, starters: formatData.starters, bench: formatData.bench, details: null as any });');

code = code.replace(/setHomeState\(\{ formation: homeFormat\.formation, starters: homeFormat\.starters, bench: homeFormat\.bench \}\);/g, 'setHomeState({ formation: homeFormat.formation, starters: homeFormat.starters, bench: homeFormat.bench, details: null as any });');
code = code.replace(/setAwayState\(\{ formation: awayFormat\.formation, starters: awayFormat\.starters, bench: awayFormat\.bench \}\);/g, 'setAwayState({ formation: awayFormat.formation, starters: awayFormat.starters, bench: awayFormat.bench, details: null as any });');

// Just catch-all replace if there are other variations
code = code.replace(/bench: homeFormat\.bench \}\)/g, 'bench: homeFormat.bench, details: null as any })');
code = code.replace(/bench: awayFormat\.bench \}\)/g, 'bench: awayFormat.bench, details: null as any })');

fs.writeFileSync('src/app/formazioni/page.tsx', code, 'utf8');
