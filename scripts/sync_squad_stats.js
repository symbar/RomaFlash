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
    return { ...player, mv: null, partite: 0, gol: 0, cleanSheet: 0, assist: 0, matchVotes: [] };
  }

  // 1. Media voto
  const mvMatch = html.match(/Media Voto[\s\S]*?class="badge[^"]*avg">([\d,]+)<\/span>/i);

  // 2. Partite, Gol, Assist (dalla tabella large-stats precisa)
  const largeStatsMatch = html.match(/<table class="large-stats">([\s\S]*?)<\/table>/i);
  const largeStatsHtml = largeStatsMatch ? largeStatsMatch[1] : '';

  const partiteMatch = largeStatsHtml.match(/Partite a voto[\s\S]*?class="value">(\d+)<\/td>/i);
  const golMatch = largeStatsHtml.match(/<th[^>]*>Gol<\/th>[\s\S]*?class="value">(\d+)<\/td>/i);
  const golSubitiMatch = largeStatsHtml.match(/<th[^>]*>Gol subiti<\/th>[\s\S]*?class="value">(\d+)<\/td>/i);
  const assistMatch = largeStatsHtml.match(/<th[^>]*>Assist<\/th>[\s\S]*?class="value">(\d+)<\/td>/i);

  // Small stats: Ammonizioni, Espulsioni, Clean Sheet
  const smallStatsMatch = html.match(/<table class="small-stats">([\s\S]*?)<\/table>/i);
  const smallStatsHtml = smallStatsMatch ? smallStatsMatch[1] : '';
  const cleanSheetMatch = html.match(/<th[^>]*>Porte inviolate<\/th>[\s\S]*?class="value">(\d+)<\/td>/i);
  const ammonizioniMatch = smallStatsHtml.match(/Ammonizioni[\s\S]*?class="pill">(\d+)<\/span>/i);
  const espulsioniMatch = smallStatsHtml.match(/Espulsioni[\s\S]*?class="pill">(\d+)<\/span>/i);

  // 3. Info anagrafiche
  const heightMatch = html.match(/itemprop="height">([^<]+)<\/dd>/i);
  const birthMatch = html.match(/class="birthdate">([^<]+)<\/dd>/i);
  const footMatch = html.match(/<dt>Piede<\/dt>[\s\S]*?title="([^"]+)"/i);
  const natMatch = html.match(/class="nationalities">([^<]+)<\/dd>/i);

  // 4. Estrazione partite con avversario e voto da player-summary-table
  const summaryTableMatch = html.match(/<table class="player-summary-table">([\s\S]*?)<\/table>/i);
  const allVotes = [];

  if (summaryTableMatch) {
    const rows = [...summaryTableMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];
    rows.forEach(r => {
      const gwMatch = r[1].match(/class="matchweek[^"]*"[^>]*>(\d+)<\/span>/i);
      const homeMatch = r[1].match(/class="team-home[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const awayMatch = r[1].match(/class="team-away[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const gradeMatch = r[1].match(/class="grade"[^>]*data-value="([^"]*)"/i);

      if (gwMatch && gradeMatch && gradeMatch[1] && gradeMatch[1].trim() !== '') {
        const gw = parseInt(gwMatch[1]);
        const home = homeMatch ? homeMatch[1].trim() : '';
        const away = awayMatch ? awayMatch[1].trim() : '';
        let opponent = home.toLowerCase().includes('rom') ? away : home;
        opponent = opponent.toUpperCase().trim();

        const gradeVal = parseFloat(gradeMatch[1].replace(',', '.'));
        if (!isNaN(gradeVal) && gradeVal > 0) {
          allVotes.push({
            matchday: gw,
            opponent: opponent || `G${gw}`,
            grade: gradeVal
          });
        }
      }
    });
  }

  // Prendi RIGOROSAMENTE le ULTIME 5 PAGELLE a voto
  const last5Votes = allVotes.slice(-5);

  return {
    id: player.id,
    name: player.name,
    fullName: player.fullName,
    role: player.role,
    slug: player.slug,
    imagePath: player.imagePath,
    mv: mvMatch ? parseFloat(mvMatch[1].replace(',', '.')) : null,
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
    matchVotes: last5Votes
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
  console.log(`Caricamento statistiche e ultime 5 pagelle per ${playersRaw.length} giocatori...`);
  
  const results = [];
  for (const p of playersRaw) {
    process.stdout.write(`Scraping ${p.fullName} (${p.slug})... `);
    try {
      const stats = await scrapePlayer(p);
      stats.number = officialJerseyNumbers[p.slug] || 0;
      results.push(stats);
      console.log(`OK (P: ${stats.partite}, G: ${stats.gol}, A: ${stats.assist}, MV: ${stats.mv || '-'}, Voti: ${stats.matchVotes.length})`);
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
  console.log(`\nCompletato! Salvato src/data/squad_stats.json (${results.length} giocatori con ultime 5 pagelle e codice avversaria).`);
}

main();
