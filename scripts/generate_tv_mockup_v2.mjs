import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

// Canvas ad altissima risoluzione per essere nitido su schermi Retina / 4K
const width = 1280;
const height = 980;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Sfondo moderno grigio chiaro editoriale
ctx.fillStyle = '#f1f5f9';
ctx.fillRect(0, 0, width, height);

// Helper rettangolo con angoli arrotondati
function roundRect(ctx, x, y, w, h, r, fillStyle, strokeStyle, lineWidth = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

// Helper per badge con stile realistico
function drawDaznBadge(x, y, scale = 1) {
  const w = 76 * scale;
  const h = 28 * scale;
  roundRect(ctx, x, y, w, h, 6 * scale, '#111111');
  
  // Pallino giallo acido
  ctx.fillStyle = '#f3ff00';
  ctx.beginPath();
  ctx.arc(x + 13 * scale, y + h / 2, 3.5 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Testo DAZN
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${13 * scale}px Arial, Helvetica, sans-serif`;
  ctx.fillText('DAZN', x + 23 * scale, y + h / 2 + 4.5 * scale);
}

function drawSkySportBadge(x, y, scale = 1) {
  const w = 98 * scale;
  const h = 28 * scale;
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#00195a');
  grad.addColorStop(0.55, '#003893');
  grad.addColorStop(1, '#c7173e');
  roundRect(ctx, x, y, w, h, 6 * scale, grad);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${12 * scale}px Arial, Helvetica, sans-serif`;
  ctx.fillText('sky sport', x + 18 * scale, y + h / 2 + 4 * scale);
}

function drawNowBadge(x, y, scale = 1) {
  const w = 62 * scale;
  const h = 28 * scale;
  roundRect(ctx, x, y, w, h, 6 * scale, '#022c22', '#047857', 1.5 * scale);

  ctx.fillStyle = '#00eb96';
  ctx.beginPath();
  ctx.arc(x + 12 * scale, y + h / 2, 3 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00eb96';
  ctx.font = `900 ${12 * scale}px Arial, Helvetica, sans-serif`;
  ctx.fillText('NOW', x + 21 * scale, y + h / 2 + 4 * scale);
}

function drawMediasetBadge(x, y, scale = 1) {
  const w = 110 * scale;
  const h = 28 * scale;
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#003366');
  grad.addColorStop(1, '#0066cc');
  roundRect(ctx, x, y, w, h, 6 * scale, grad);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${10.5 * scale}px Arial, Helvetica, sans-serif`;
  ctx.fillText('CANALE 5 / INF.', x + 10 * scale, y + h / 2 + 3.5 * scale);
}

function drawPrimeBadge(x, y, scale = 1) {
  const w = 92 * scale;
  const h = 28 * scale;
  roundRect(ctx, x, y, w, h, 6 * scale, '#001a2e', '#00a8e1', 1.2 * scale);

  ctx.fillStyle = '#ffffff';
  ctx.font = `normal ${10 * scale}px Arial, Helvetica, sans-serif`;
  ctx.fillText('prime', x + 10 * scale, y + h / 2 + 3 * scale);

  ctx.fillStyle = '#00a8e1';
  ctx.font = `900 ${11 * scale}px Arial, Helvetica, sans-serif`;
  ctx.fillText('video', x + 44 * scale, y + h / 2 + 3 * scale);
}

// -------------------------------------------------------------
// HEADER DELLA TAVOLA
// -------------------------------------------------------------
roundRect(ctx, 40, 30, width - 80, 80, 16, '#ffffff', '#e2e8f0', 1);

ctx.fillStyle = '#8E1B23';
ctx.font = '900 28px Arial, Helvetica, sans-serif';
ctx.fillText('ROMAFLASH', 65, 78);

ctx.fillStyle = '#64748b';
ctx.font = 'normal 24px Arial, Helvetica, sans-serif';
ctx.fillText('•', 245, 76);

ctx.fillStyle = '#0f172a';
ctx.font = 'bold 24px Arial, Helvetica, sans-serif';
ctx.fillText('Guida TV "Dove Vederla" (Box sotto il Countdown)', 265, 78);

// -------------------------------------------------------------
// OPZIONE 1: SUB-BAR INTEGRATA (LA MIGLIORE)
// -------------------------------------------------------------
const col1X = 50;
const col1Y = 135;
const col1W = 570;

ctx.fillStyle = '#8E1B23';
ctx.font = 'bold 18px Arial, Helvetica, sans-serif';
ctx.fillText('OPZIONE 1 (Raccomandata): Sub-Bar Integrata', col1X, col1Y);

ctx.fillStyle = '#475569';
ctx.font = '13px Arial, Helvetica, sans-serif';
ctx.fillText('Si inserisce nello stesso widget di oggi nella sidebar. Zero spreco di spazio.', col1X, col1Y + 22);

// SIMULAZIONE WIDGET SERIE A
const w1Y = col1Y + 40;
const w1H = 138;

// Bordo gradiente RomaFlash
const g1 = ctx.createLinearGradient(col1X, w1Y, col1X + col1W, w1Y);
g1.addColorStop(0, '#8E1B23');
g1.addColorStop(1, '#D97706');
roundRect(ctx, col1X, w1Y, col1W, w1H, 16, g1);

// Corpo bianco
roundRect(ctx, col1X + 1.5, w1Y + 1.5, col1W - 3, w1H - 3, 14.5, '#ffffff');

// Match Header
ctx.fillStyle = '#64748b';
ctx.font = 'bold 10px Arial, Helvetica, sans-serif';
ctx.fillText('SERIE A ENILIVE  •  GIORNATA 10', col1X + 20, w1Y + 26);

ctx.fillStyle = '#0f172a';
ctx.font = '900 20px Arial, Helvetica, sans-serif';
ctx.fillText('ROMA', col1X + 20, w1Y + 54);
ctx.fillStyle = '#d97706';
ctx.font = 'bold 16px Arial, Helvetica, sans-serif';
ctx.fillText('vs', col1X + 94, w1Y + 53);
ctx.fillStyle = '#0f172a';
ctx.font = '900 20px Arial, Helvetica, sans-serif';
ctx.fillText('INTER', col1X + 118, w1Y + 54);

ctx.fillStyle = '#94a3b8';
ctx.font = '11px Arial, Helvetica, sans-serif';
ctx.fillText('Dom 20 Ott • 20:45 • Stadio Olimpico', col1X + 20, w1Y + 75);

// Countdown blocks a destra
const cdStartX = col1X + 340;
const cdStartY = w1Y + 20;
const cdData = [
  { val: '02', lbl: 'G' },
  { val: '05', lbl: 'O' },
  { val: '18', lbl: 'M' },
  { val: '42', lbl: 'S', hl: true }
];

cdData.forEach((item, i) => {
  const bx = cdStartX + i * 50;
  roundRect(ctx, bx, cdStartY, 40, 48, 8, item.hl ? '#fef3c7' : '#f8fafc', item.hl ? '#fde68a' : '#e2e8f0', 1);
  ctx.fillStyle = item.hl ? '#b45309' : '#0f172a';
  ctx.font = '900 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(item.val, bx + 20, cdStartY + 27);
  ctx.fillStyle = item.hl ? '#d97706' : '#64748b';
  ctx.font = 'bold 9px Arial, Helvetica, sans-serif';
  ctx.fillText(item.lbl, bx + 20, cdStartY + 42);
  ctx.textAlign = 'left';

  if (i < 3) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 16px Arial, Helvetica, sans-serif';
    ctx.fillText(':', bx + 43, cdStartY + 28);
  }
});

// SUB-BAR GUIDA TV
const barY = w1Y + 92;
const barH = 43;
roundRect(ctx, col1X + 1.5, barY, col1W - 3, barH, 0, '#f8fafc');
roundRect(ctx, col1X + 1.5, barY + 15, col1W - 3, barH - 15, 14.5, '#f8fafc');

// Linea divisoria
ctx.beginPath();
ctx.moveTo(col1X + 1.5, barY);
ctx.lineTo(col1X + col1W - 1.5, barY);
ctx.strokeStyle = '#f1f5f9';
ctx.lineWidth = 1;
ctx.stroke();

ctx.fillStyle = '#475569';
ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
ctx.fillText('IN DIRETTA TV:', col1X + 20, barY + 26);

// Badges
drawDaznBadge(col1X + 265, barY + 7, 0.95);
drawSkySportBadge(col1X + 348, barY + 7, 0.95);
drawNowBadge(col1X + 450, barY + 7, 0.95);


// SECONDO ESEMPIO: COPPA ITALIA (SOLO MEDIASET IN CHIARO)
const w2Y = w1Y + w1H + 25;
roundRect(ctx, col1X, w2Y, col1W, w1H, 16, g1);
roundRect(ctx, col1X + 1.5, w2Y + 1.5, col1W - 3, w1H - 3, 14.5, '#ffffff');

ctx.fillStyle = '#059669';
ctx.font = 'bold 10px Arial, Helvetica, sans-serif';
ctx.fillText('COPPA ITALIA FRECCIAROSSA  •  OTTAVI', col1X + 20, w2Y + 26);

ctx.fillStyle = '#0f172a';
ctx.font = '900 20px Arial, Helvetica, sans-serif';
ctx.fillText('ROMA', col1X + 20, w2Y + 54);
ctx.fillStyle = '#d97706';
ctx.font = 'bold 16px Arial, Helvetica, sans-serif';
ctx.fillText('vs', col1X + 94, w2Y + 53);
ctx.fillStyle = '#0f172a';
ctx.font = '900 20px Arial, Helvetica, sans-serif';
ctx.fillText('SAMPDORIA', col1X + 118, w2Y + 54);

ctx.fillStyle = '#94a3b8';
ctx.font = '11px Arial, Helvetica, sans-serif';
ctx.fillText('Mer 18 Dic • 21:00 • In chiaro su TV', col1X + 20, w2Y + 75);

// Mini Countdown
cdData.forEach((item, i) => {
  const bx = cdStartX + i * 50;
  roundRect(ctx, bx, w2Y + 20, 40, 48, 8, '#f8fafc', '#e2e8f0', 1);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(item.val, bx + 20, w2Y + 47);
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 9px Arial, Helvetica, sans-serif';
  ctx.fillText(item.lbl, bx + 20, w2Y + 62);
  ctx.textAlign = 'left';
  if (i < 3) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 16px Arial, Helvetica, sans-serif';
    ctx.fillText(':', bx + 43, w2Y + 48);
  }
});

// SUB-BAR COPPA ITALIA
const bar2Y = w2Y + 92;
roundRect(ctx, col1X + 1.5, bar2Y, col1W - 3, barH, 0, '#f8fafc');
roundRect(ctx, col1X + 1.5, bar2Y + 15, col1W - 3, barH - 15, 14.5, '#f8fafc');

ctx.beginPath();
ctx.moveTo(col1X + 1.5, bar2Y);
ctx.lineTo(col1X + col1W - 1.5, bar2Y);
ctx.strokeStyle = '#f1f5f9';
ctx.lineWidth = 1;
ctx.stroke();

ctx.fillStyle = '#475569';
ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
ctx.fillText('IN DIRETTA TV GRATIS:', col1X + 20, bar2Y + 26);

drawMediasetBadge(col1X + 395, bar2Y + 7, 1);


// -------------------------------------------------------------
// COLONNA DESTRA: COME VENGONO REPERITI I DATI (RISPOSTA ALLA DOMANDA)
// -------------------------------------------------------------
const col2X = 660;
const col2Y = 135;
const col2W = 570;

ctx.fillStyle = '#0369a1';
ctx.font = 'bold 18px Arial, Helvetica, sans-serif';
ctx.fillText('DA DOVE PRENDIAMO I DATI? (Architettura Completa)', col2X, col2Y);

ctx.fillStyle = '#475569';
ctx.font = '13px Arial, Helvetica, sans-serif';
ctx.fillText('Nessuna API a pagamento necessaria: il sistema è 100% autonomo.', col2X, col2Y + 22);

// Card Spiegazione Dati
const dBoxY = col2Y + 40;
const dBoxH = 300;
roundRect(ctx, col2X, dBoxY, col2W, dBoxH, 16, '#ffffff', '#cbd5e1', 1);

const items = [
  {
    title: '1. I Diritti TV in Italia sono Normati e Fissi (2024 - 2029)',
    desc: 'La Lega Serie A e la UEFA assegnano i diritti a bando pluriennale:\n• Serie A: Tutte le 10 gare SEMPRE su DAZN; 3 in co-esclusiva con Sky/NOW.\n• Europa League: 100% su Sky Sport e NOW (+ eventuale TV8 in chiaro).\n• Coppa Italia & Supercoppa: 100% in chiaro su Mediaset (Canale 5 / Infinity).'
  },
  {
    title: '2. Regola Intelligente Automatica su RomaFlash',
    desc: 'L\'app conosce già competizione, data e orario (già sincronizzati nel DB):\n• Se Coppa Italia -> Mostra subito Mediaset.\n• Se Europa League -> Mostra Sky Sport e NOW.\n• Se Serie A -> Mostra DAZN (e aggiunge Sky/NOW se negli orari co-esclusiva).'
  },
  {
    title: '3. Tabella Supabase "calendar_matches" (Override 100% Esatto)',
    desc: 'Nel database aggiungiamo la colonna: tv_channels text[] (es. ["DAZN", "Sky Sport"]).\nSe presente sovrascrive il default. Basta un click o script una volta al mese\nquando la Lega Calcio pubblica gli anticipi ufficiali.'
  }
];

let curY = dBoxY + 25;
items.forEach((it, idx) => {
  roundRect(ctx, col2X + 16, curY - 5, 24, 24, 6, '#e0f2fe');
  ctx.fillStyle = '#0284c7';
  ctx.font = '900 12px Arial, Helvetica, sans-serif';
  ctx.fillText(`${idx + 1}`, col2X + 24, curY + 12);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px Arial, Helvetica, sans-serif';
  ctx.fillText(it.title, col2X + 48, curY + 12);

  ctx.fillStyle = '#475569';
  ctx.font = '11px Arial, Helvetica, sans-serif';
  const descLines = it.desc.split('\n');
  descLines.forEach((l, lIdx) => {
    ctx.fillText(l, col2X + 48, curY + 30 + lIdx * 16);
  });

  curY += 88;
});


// -------------------------------------------------------------
// BOX IN BASSO: PANORAMICA CANALI E BADGE SUPPORTATI
// -------------------------------------------------------------
const footY = 480;
const footW = width - 80;
const footH = 440;
roundRect(ctx, 40, footY, footW, footH, 16, '#0f172a');

ctx.fillStyle = '#f8fafc';
ctx.font = 'bold 18px Arial, Helvetica, sans-serif';
ctx.fillText('TUTTI I BADGE SUPPORTATI E COME VERRANNO RENDERIZZATI', 65, footY + 40);

ctx.fillStyle = '#94a3b8';
ctx.font = '13px Arial, Helvetica, sans-serif';
ctx.fillText('Grafica vettoriale pura nativa in React/Tailwind, senza dipendenze da immagini esterne pesanti.', 65, footY + 62);

const badgeDemoGrid = [
  { name: 'DAZN', sub: 'Tutta la Serie A (10 gare su 10) + Zona DAZN', draw: (x, y) => drawDaznBadge(x, y, 1.1) },
  { name: 'Sky Sport', sub: '3 gare Serie A + Tutta Europa & Conference League', draw: (x, y) => drawSkySportBadge(x, y, 1.1) },
  { name: 'NOW', sub: 'Streaming pass sport per tutti i contenuti Sky', draw: (x, y) => drawNowBadge(x, y, 1.1) },
  { name: 'Mediaset Canale 5', sub: 'Coppa Italia & Supercoppa Italiana (gratis)', draw: (x, y) => drawMediasetBadge(x, y, 1.1) },
  { name: 'Amazon Prime Video', sub: 'Miglior gara del mercoledì Champions League', draw: (x, y) => drawPrimeBadge(x, y, 1.1) }
];

badgeDemoGrid.forEach((bg, idx) => {
  const rowY = footY + 95 + idx * 62;
  roundRect(ctx, 65, rowY, footW - 50, 52, 10, '#1e293b', '#334155', 1);

  bg.draw(85, rowY + 10);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial, Helvetica, sans-serif';
  ctx.fillText(bg.name, 230, rowY + 24);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Arial, Helvetica, sans-serif';
  ctx.fillText(bg.sub, 230, rowY + 42);
});

// Save image
const outDir = 'C:/Users/simone.barbieri/.gemini/antigravity/brain/9f4d8b59-c278-4cfd-9963-f1b903fa5f16';
const buffer = canvas.toBuffer('image/png');
const outPath = path.join(outDir, 'mockup_guida_tv_dettagliata.png');
fs.writeFileSync(outPath, buffer);

// Also copy to public/images/ so it can be previewed or served
const pubPath = path.join(process.cwd(), 'public/images/mockup_guida_tv.png');
fs.writeFileSync(pubPath, buffer);

console.log('Saved high-res mockup to:', outPath);
console.log('Saved copy to public:', pubPath);
