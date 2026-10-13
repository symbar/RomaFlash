const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createTacticalMatchGraphic({
  homeName = 'ROMA',
  awayName = 'FIORENTINA',
  homeScore = '4',
  awayScore = '0',
  competition = 'SERIE A',
  homeLogoUrl = 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
  awayLogoUrl = 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png',
  outputPath
}) {
  const baseImgPath = path.join(__dirname, '..', 'public', 'images', 'analista', 'lavagna-tattica.jpg');
  const baseMeta = await sharp(baseImgPath).metadata();
  const W = baseMeta.width;  // 1376
  const H = baseMeta.height; // 768

  const [romaBuf, fioBuf] = await Promise.all([
    fetch(homeLogoUrl).then(r => r.arrayBuffer()).then(b => Buffer.from(b)),
    fetch(awayLogoUrl).then(r => r.arrayBuffer()).then(b => Buffer.from(b))
  ]);

  const romaB64 = 'data:image/png;base64,' + romaBuf.toString('base64');
  const fioB64 = 'data:image/png;base64,' + fioBuf.toString('base64');

  // Premium editorial match graphics
  const hudWidth = 680;
  const hudHeight = 120;
  const hudX = Math.round((W - hudWidth) / 2); // 348
  const hudY = 32;

  const svgOverlay = `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="hudShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#000000" flood-opacity="0.85"/>
      </filter>
      <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#f0b516" flood-opacity="0.6"/>
      </filter>
      <filter id="awayGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#ffffff" flood-opacity="0.3"/>
      </filter>
      <linearGradient id="hudGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0e1714" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#050a08" stop-opacity="0.97"/>
      </linearGradient>
    </defs>

    <!-- Top Matchup Badge HUD (Centered) -->
    <g transform="translate(${hudX}, ${hudY})" filter="url(#hudShadow)">
      <!-- HUD Container -->
      <rect x="0" y="0" width="${hudWidth}" height="${hudHeight}" rx="60" fill="url(#hudGrad)" stroke="#f0b516" stroke-opacity="0.5" stroke-width="2" />
      
      <!-- Top Category Pill -->
      <rect x="${(hudWidth - 220) / 2}" y="-13" width="220" height="26" rx="13" fill="#2a070c" stroke="#f0b516" stroke-width="1.5" />
      <text x="${hudWidth / 2}" y="5" text-anchor="middle" fill="#f0b516" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="900" letter-spacing="2.5">L'ANALISTA • ${competition}</text>

      <!-- Home Team Crest & Name -->
      <g transform="translate(30, 20)">
        <image href="${romaB64}" x="0" y="0" width="80" height="80" />
      </g>
      <text x="125" y="68" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" letter-spacing="1">${homeName}</text>

      <!-- Central Score / VS Pill -->
      <g transform="translate(${hudWidth / 2 - 60}, 34)">
        <rect x="0" y="0" width="120" height="52" rx="26" fill="#14211d" stroke="rgba(240, 181, 22, 0.4)" stroke-width="1.5" />
        <text x="60" y="35" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="25" font-weight="900" letter-spacing="3">${homeScore} - ${awayScore}</text>
      </g>

      <!-- Away Team Crest & Name -->
      <text x="${hudWidth - 125}" y="68" text-anchor="end" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" letter-spacing="1">${awayName}</text>
      <g transform="translate(${hudWidth - 110}, 20)">
        <image href="${fioB64}" x="0" y="0" width="80" height="80" />
      </g>
    </g>

    <!-- Pitch Badges on the two goals/halves -->
    <!-- Left Goal Badge (AS Roma) -->
    <g transform="translate(100, 314)" filter="url(#goldGlow)">
      <circle cx="70" cy="70" r="70" fill="#091310" fill-opacity="0.9" stroke="#f0b516" stroke-opacity="0.8" stroke-width="2.5" />
      <image href="${romaB64}" x="20" y="20" width="100" height="100" />
    </g>

    <!-- Right Goal Badge (Away Team) -->
    <g transform="translate(1136, 314)" filter="url(#awayGlow)">
      <circle cx="70" cy="70" r="70" fill="#091310" fill-opacity="0.9" stroke="rgba(255, 255, 255, 0.45)" stroke-width="2.5" />
      <image href="${fioB64}" x="20" y="20" width="100" height="100" />
    </g>
  </svg>
  `;

  await sharp(baseImgPath)
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toFile(outputPath);

  console.log('Saved to:', outputPath);
}

module.exports = { createTacticalMatchGraphic };

if (require.main === module) {
  const targetPath = process.argv[2] || 'C:/Users/simone.barbieri/.gemini/antigravity/brain/9f4d8b59-c278-4cfd-9963-f1b903fa5f16/analista_roma_fiorentina_test.jpg';

  createTacticalMatchGraphic({
    homeName: 'ROMA',
    awayName: 'FIORENTINA',
    homeScore: '4',
    awayScore: '0',
    competition: 'SERIE A',
    homeLogoUrl: 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
    awayLogoUrl: 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png',
    outputPath: targetPath
  }).catch(console.error);
}
