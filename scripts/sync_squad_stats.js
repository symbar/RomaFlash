const fs = require('fs');
const https = require('https');

function get(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function scrapePlayer(player) {
  const url = `https://www.fantacalcio.it/serie-a/squadre/roma/${player.slug}/${player.id}`;
  const html = await get(url);
  if (!html || html.length < 500) {
    return { ...player, mv: null, fm: null, partite: 0, gol: 0, assist: 0, matchVotes: [] };
  }

  // 1. Media voto & Fantamedia
  const mvMatch = html.match(/Media Voto[\s\S]*?class="badge[^"]*avg">([\d,]+)<\/span>/i);
  const fmMatch = html.match(/Fantamedia[\s\S]*?class="badge[^"]*avg">([\d,]+)<\/span>/i);

  // 2. Partite, Gol, Assist, Cartellini
  const partiteMatch = html.match(/Partite a voto[\s\S]*?class="value">(\d+)<\/td>/i);
  const golMatch = html.match(/<th[^>]*>Gol<\/th>[\s\S]*?class="value">(\d+)<\/td>/i);
  const golSubitiMatch = html.match(/<th[^>]*>Gol subiti<\/th>[\s\S]*?class="value">(\d+)<\/td>/i);
  const cleanSheetMatch = html.match(/<th[^>]*>Porte inviolate<\/th>[\s\S]*?class="value">(\d+)<\/td>/i);
  const assistMatch = html.match(/Assist[\s\S]*?class="value">(\d+)<\/td>/i);
  const ammonizioniMatch = html.match(/Ammonizioni[\s\S]*?class="pill">(\d+)<\/span>/i);
  const espulsioniMatch = html.match(/Espulsioni[\s\S]*?class="pill">(\d+)<\/span>/i);

  // 3. Info anagrafiche
  const heightMatch = html.match(/itemprop="height">([^<]+)<\/dd>/i);
  const birthMatch = html.match(/class="birthdate">([^<]+)<\/dd>/i);
  const footMatch = html.match(/<dt>Piede<\/dt>[\s\S]*?title="([^"]+)"/i);
  const natMatch = html.match(/class="nationalities">([^<]+)<\/dd>/i);

  // 4. Quotazioni e FVM
  const quotMatch = html.match(/Quotazione Classic[\s\S]*?class="value">(\d+)<\/meta>/i) || html.match(/Quotazione classic[\s\S]*?class="badge[^"]*">(\d+)<\/span>/i);
  const fvmMatch = html.match(/FantaValore di Mercato \(Classic\)[\s\S]*?class="badge[^"]*">(\d+)<\/span>/i);

  // 5. Ultimi voti da x-axis
  const xAxisMatch = html.match(/<div class="x-axis">([\s\S]*?)<\/div>/i);
  const matchVotes = [];
  if (xAxisMatch) {
    const spans = [...xAxisMatch[1].matchAll(/data-x="(\d+)"\s+data-primary-value="([^"]*)"\s+data-secondary-value="([^"]*)"/gi)];
    spans.forEach(m => {
      if (m[2] && m[2].trim() !== '') {
        matchVotes.push({
          matchday: parseInt(m[1]),
          grade: parseFloat(m[2].replace(',', '.')),
          fantaGrade: parseFloat(m[3]?.replace(',', '.') || m[2].replace(',', '.'))
        });
      }
    });
  }

  // Calcolo Heat Index sintetico (0 - 100) basato su media voto, ultime presenze e fantaGrade
  const mvVal = mvMatch ? parseFloat(mvMatch[1].replace(',', '.')) : 6.0;
  const recentVotes = matchVotes.slice(-5);
  const recentAvg = recentVotes.length > 0 
    ? recentVotes.reduce((acc, v) => acc + v.grade, 0) / recentVotes.length 
    : mvVal;
  const heatIndex = Math.min(99, Math.max(50, Math.round((recentAvg / 8.0) * 85 + (recentVotes.length * 2.5))));

  return {
    id: player.id,
    name: player.name,
    fullName: player.fullName,
    role: player.role,
    slug: player.slug,
    imagePath: player.imagePath,
    mv: mvMatch ? parseFloat(mvMatch[1].replace(',', '.')) : null,
    fm: fmMatch ? parseFloat(fmMatch[1].replace(',', '.')) : null,
    partite: partiteMatch ? parseInt(partiteMatch[1]) : 0,
    gol: golMatch ? parseInt(golMatch[1]) : (golSubitiMatch ? parseInt(golSubitiMatch[1]) : 0),
    cleanSheet: cleanSheetMatch ? parseInt(cleanSheetMatch[1]) : 0,
    assist: assistMatch ? parseInt(assistMatch[1]) : 0,
    ammonizioni: ammonizioniMatch ? parseInt(ammonizioniMatch[1]) : 0,
    espulsioni: espulsioniMatch ? parseInt(espulsioniMatch[1]) : 0,
    height: heightMatch ? heightMatch[1].trim() : null,
    birthdate: birthMatch ? birthMatch[1].trim() : null,
    foot: footMatch ? footMatch[1].trim() : null,
    nationalities: natMatch ? natMatch[1].trim() : null,
    quotazione: quotMatch ? parseInt(quotMatch[1]) : null,
    fvm: fvmMatch ? parseInt(fvmMatch[1]) : null,
    heatIndex,
    matchVotes
  };
}

// Numeri di maglia ufficiali 2026/27 AS Roma
const officialJerseyNumbers = {
  'svilar': 99,
  'gollini': 95,
  'demarzi': 89,
  'vasquez': 1,
  'mancini': 23,
  'ndicka': 5,
  'hermoso': 22,
  'ghilardi': 84,
  'koulierakis': 4,
  'balerdi': 6,
  'rensch': 2,
  'wesley': 3,
  'molina': 16,
  'lulli': 42,
  'cristante': 4,
  'pellegrini': 7,
  'kone': 17,
  'deroon': 15,
  'pisilli': 61,
  'mora': 82,
  'dybala': 21,
  'soule': 18,
  'castro': 9,
  'malen': 11
};

async function main() {
  const playersRaw = JSON.parse(fs.readFileSync('public/images/players/players.json', 'utf8'));
  console.log(`Caricamento statistiche per ${playersRaw.length} giocatori...`);
  
  const results = [];
  for (const p of playersRaw) {
    process.stdout.write(`Scraping ${p.fullName} (${p.slug})... `);
    try {
      const stats = await scrapePlayer(p);
      stats.number = officialJerseyNumbers[p.slug] || 0;
      results.push(stats);
      console.log(`OK (MV: ${stats.mv || '-'}, P: ${stats.partite}, G: ${stats.gol})`);
    } catch (e) {
      console.log(`ERR: ${e.message}`);
      results.push({ ...p, number: officialJerseyNumbers[p.slug] || 0, partite: 0, gol: 0, assist: 0, matchVotes: [] });
    }
  }

  // Save to src/data/squad_stats.json
  if (!fs.existsSync('src/data')) {
    fs.mkdirSync('src/data', { recursive: true });
  }
  fs.writeFileSync('src/data/squad_stats.json', JSON.stringify(results, null, 2));
  console.log(`\nCompletato! Salvato src/data/squad_stats.json (${results.length} giocatori).`);
}

main();
