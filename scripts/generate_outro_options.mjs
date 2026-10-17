import { createCanvas, loadImage, Path2D } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";

const W = 1080;
const H = 1350;

const WOLF_SVG =
  "M179.3 38.94C154.7 77.7 142.7 139.7 168.4 185.9l-16.3 9.2c-6.7-11.9-11.2-24.4-13.9-37.2c-34.5-6.3-69.42-7.5-104.98-2.1c34.07 10.1 52.77 23.7 76.68 46.7c-26.82 9.7-60.25 30.2-92.93 70.2c35.47-8.8 64.83-11.5 89.43-6.3c-36.94 22.5-64.06 56.1-88.34 114.1c35.9-17.2 64.89-18.8 102.94-18.8c-23.07 32.7-35.27 77.2-36.31 112.8c24.51-26 57.61-60.2 87.21-79c3 29.9 15 58.3 35.9 85.3c-.2-43.9 10.3-88.3 31.6-133.4c-18.8 9-32.4 18.1-49.9 29.3c6.2-27.9 12.4-55.8 18.7-83.7c-23.3 2.4-39 10-60.5 18.5c16.3-33.1 32.7-66.1 49.1-99.2l16.8 8.3l-28.4 57.4c18.4-4.4 28.7-4.1 45.7-1.3c-4.5 20.4-9 40.7-13.6 61c65.3-36.2 148.3-45.9 226.7-50c7.6-12.9 13.8-24.2 18.8-34.8l-6.3-24.4l-24.4 30.8l-7.8-27.5l-22.5 29.2l-7.5-26.1l-23.9 31.5l-7.7-28.2l-23.8 31.4l1.2-41.1l22.6-42.7l7.6 28.3l23.9-31.5l7.6 28.2l23.5-30l6.5 26.9l24.5-30.8l7.8 27.5l24.6-32c2.3-10.8 4.6-22.4 7.4-35.7c-55.5-3.7-106.3 4.8-154 9.8c-38-20.8-80.8-26.8-121.9-18.5c-13.6-29.69-27.2-59.38-40.9-89.06M325.5 158.3c-4.5 14.2-13 18.3-24.7 20.6c-16.1-4.4-28.3-15.5-34.4-30.2c20.4-3.8 42.4 3.4 59.1 9.6";

const ARTIFACT_DIR = "C:/Users/simone.barbieri/.gemini/antigravity/brain/9f4d8b59-c278-4cfd-9963-f1b903fa5f16";
const PUBLIC_DIR = "c:/Users/simone.barbieri/.gemini/antigravity/scratch/romaflash/public/images/outro_options";
const LOGO_PATH = "c:/Users/simone.barbieri/.gemini/antigravity/scratch/romaflash/public/images/logo/romaflash-logo-cerchiato-transparent.png";
const CURVA_PATH = "c:/Users/simone.barbieri/.gemini/antigravity/scratch/romaflash/public/images/archive/roma-11.jpg";

function saveCanvas(canvas, filename) {
  const buf = canvas.toBuffer("image/jpeg");
  const p1 = path.join(ARTIFACT_DIR, filename);
  const p2 = path.join(PUBLIC_DIR, filename);
  fs.writeFileSync(p1, buf);
  fs.writeFileSync(p2, buf);
  console.log(`Saved: ${filename} (${buf.length} bytes)`);
}

function drawCrest(ctx, cx, cy, r) {
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = Math.round(r * 0.25);
  ctx.shadowOffsetY = Math.round(r * 0.08);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#220409";
  ctx.fill();

  ctx.shadowColor = "transparent";

  // Gold outer ring
  ctx.lineWidth = Math.max(4, Math.round(r * 0.07));
  ctx.strokeStyle = "#f0b516";
  ctx.stroke();

  // Carmine inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, r - Math.round(r * 0.075), 0, Math.PI * 2);
  ctx.lineWidth = Math.max(2, Math.round(r * 0.03));
  ctx.strokeStyle = "rgba(224, 45, 71, 0.9)";
  ctx.stroke();

  // Lupetto
  const wolfSize = r * 1.15;
  ctx.save();
  ctx.translate(cx - wolfSize / 2, cy - r * 0.65);
  const scale = wolfSize / 512;
  ctx.scale(scale, scale);
  const wolfPath = new Path2D(WOLF_SVG);
  ctx.fillStyle = "#f0b516";
  ctx.fill(wolfPath);
  ctx.restore();

  // Testo ROMAFLASH
  ctx.font = `900 ${Math.round(r * 0.22)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("ROMAFLASH", cx, cy + r * 0.52);

  ctx.restore();
}

/**
 * =========================================================================
 * OPZIONE 1: "Curva & Stadio Live + 3D Smartphone"
 * Atmosferica, Curva Sud sullo sfondo, smartphone dinamico e chip live
 * =========================================================================
 */
async function generateOption1() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Sfondo Curva Sud sfumato
  if (fs.existsSync(CURVA_PATH)) {
    const curvaImg = await loadImage(CURVA_PATH);
    ctx.drawImage(curvaImg, 0, 0, W, H * 0.7);
  }

  // Gradiente cinematografico profondo
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(20, 2, 5, 0.7)");
  grad.addColorStop(0.3, "rgba(35, 4, 8, 0.88)");
  grad.addColorStop(0.65, "#180205");
  grad.addColorStop(1, "#0a0103");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Radiale dorato
  const rad = ctx.createRadialGradient(W / 2, 500, 50, W / 2, 500, 500);
  rad.addColorStop(0, "rgba(240, 181, 22, 0.12)");
  rad.addColorStop(1, "transparent");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);

  // Header: Logo centrato
  drawCrest(ctx, W / 2, 130, 80);

  // Badge pill in alto
  ctx.save();
  ctx.fillStyle = "rgba(240, 181, 22, 0.15)";
  ctx.strokeStyle = "#f0b516";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 160, 230, 320, 36, 18);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 13px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🔴 LIVE DALLO STADIO E DA TRIGORIA", W / 2, 248);
  ctx.restore();

  // Smartphone Mockup centrale (moderno e inclinato leggermente o isometrico)
  const phW = 380;
  const phH = 680;
  const phX = W / 2 - phW / 2;
  const phY = 300;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 45;
  ctx.shadowOffsetY = 25;

  ctx.fillStyle = "#1e2024";
  ctx.beginPath();
  ctx.roundRect(phX, phY, phW, phH, 48);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.shadowColor = "transparent";

  // Schermo
  const sX = phX + 12;
  const sY = phY + 12;
  const sW = phW - 24;
  const sH = phH - 24;

  ctx.fillStyle = "#0c0204";
  ctx.beginPath();
  ctx.roundRect(sX, sY, sW, sH, 38);
  ctx.fill();

  // Dynamic Island
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.roundRect(phX + phW / 2 - 42, sY + 14, 84, 22, 11);
  ctx.fill();

  // App Topbar
  ctx.fillStyle = "#1c0307";
  ctx.fillRect(sX, sY + 48, sW, 48);
  ctx.font = "900 15px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.textAlign = "center";
  ctx.fillText("🐺 ROMAFLASH", sX + sW / 2, sY + 77);

  // Big Card Inside Phone
  ctx.fillStyle = "#220409";
  ctx.beginPath();
  ctx.roundRect(sX + 16, sY + 116, sW - 32, 230, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(240, 181, 22, 0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#8e1b23";
  ctx.beginPath();
  ctx.roundRect(sX + 24, sY + 126, sW - 48, 110, 12);
  ctx.fill();

  // Lupetto watermark card
  ctx.save();
  ctx.translate(sX + sW / 2 - 30, sY + 145);
  ctx.scale(60 / 512, 60 / 512);
  ctx.fillStyle = "rgba(240, 181, 22, 0.3)";
  ctx.fill(new Path2D(WOLF_SVG));
  ctx.restore();

  ctx.font = "bold 10px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.textAlign = "left";
  ctx.fillText("MATCHDAY REPORT", sX + 28, sY + 256);

  ctx.font = "900 14px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("DYBALA DECISIVO ALL'OLIMPICO", sX + 28, sY + 278);
  ctx.font = "11px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText("Sintesi, statistiche e pagelle complete.", sX + 28, sY + 298);

  // Second Card
  ctx.fillStyle = "#160205";
  ctx.beginPath();
  ctx.roundRect(sX + 16, sY + 360, sW - 32, 130, 16);
  ctx.fill();
  ctx.font = "bold 12px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.fillText("📊 SONDAGGIO LIVE DEI TIFOSI", sX + 28, sY + 390);
  ctx.font = "12px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Vota il migliore in campo di stasera", sX + 28, sY + 412);

  // Home indicator bar
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(phX + phW / 2 - 45, phY + phH - 20, 90, 4, 2);
  ctx.fill();

  ctx.restore();

  // Floating Glass Chips ai lati del telefono
  const chipLeft = (text, y) => {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.strokeStyle = "rgba(240, 181, 22, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(60, y, 220, 52, 14);
    ctx.fill();
    ctx.stroke();
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 170, y + 26);
    ctx.restore();
  };

  const chipRight = (text, y) => {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.strokeStyle = "rgba(240, 181, 22, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(W - 280, y, 220, 52, 14);
    ctx.fill();
    ctx.stroke();
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, W - 170, y + 26);
    ctx.restore();
  };

  chipLeft("⚡ Notizie in 60s", 430);
  chipLeft("⏱️ Formazioni Live", 580);
  chipRight("📊 Pagelle & Voti", 480);
  chipRight("🎙️ Audio Flash", 630);

  // Titolo CTA in basso
  ctx.save();
  ctx.font = "900 36px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 14;
  ctx.fillText("TUTTO IL MONDO ROMA IN UN TAP", W / 2, 1050);

  ctx.font = "18px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText("Senza scaricare nulla, direttamente dal tuo browser", W / 2, 1088);
  ctx.restore();

  // Bottone Primario ORO
  const btnW = 680;
  const btnH = 88;
  const btnX = (W - btnW) / 2;
  const btnY = 1130;

  ctx.save();
  ctx.shadowColor = "rgba(240, 181, 22, 0.4)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 8;

  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
  btnGrad.addColorStop(0, "#f5b800");
  btnGrad.addColorStop(1, "#df9d00");
  ctx.fillStyle = btnGrad;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 44);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.font = "900 28px Arial, sans-serif";
  ctx.fillStyle = "#180307";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "1px";
  ctx.fillText("👉 ENTRA SU ROMAFLASH.APP", W / 2, btnY + btnH / 2);
  ctx.restore();

  // Footer
  ctx.save();
  ctx.font = "14px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.textAlign = "center";
  ctx.fillText("L'informazione indipendente per i tifosi dell'AS Roma 🐺", W / 2, 1260);
  ctx.restore();

  saveCanvas(canvas, "outro_opzione_1_curva_smartphone.jpg");
}

/**
 * =========================================================================
 * OPZIONE 2: "The Athletic / Minimal Luxury Editorial"
 * Obsidian scuro, dettagli oro metallico, 4 pilastri editoriali e badge di classe
 * =========================================================================
 */
async function generateOption2() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Sfondo ossidiana con pattern geometrico di lusso
  ctx.fillStyle = "#0c0205";
  ctx.fillRect(0, 0, W, H);

  // Linee dorate architettoniche sottilissime
  ctx.save();
  ctx.strokeStyle = "rgba(240, 181, 22, 0.05)";
  ctx.lineWidth = 1;
  for (let x = 60; x < W; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 60; y < H; y += 120) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // Vignette carminio profonda
  const rad = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 800);
  rad.addColorStop(0, "rgba(92, 14, 24, 0.35)");
  rad.addColorStop(1, "transparent");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);

  // Lupetto watermark gigante al centro
  ctx.save();
  ctx.translate(W / 2 - 260, H * 0.28);
  ctx.scale(520 / 512, 520 / 512);
  ctx.fillStyle = "rgba(240, 181, 22, 0.04)";
  ctx.fill(new Path2D(WOLF_SVG));
  ctx.restore();

  // Header: Logo centrato di prestigio (diametro 180)
  drawCrest(ctx, W / 2, 150, 85);

  // Titolo Editoriale The Athletic style
  ctx.save();
  ctx.font = "900 48px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.letterSpacing = "1px";
  ctx.fillText("L'INFORMAZIONE GIALLOROSSA.", W / 2, 305);

  ctx.font = "900 48px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.fillText("SENZA CLICKBAIT. SOLO FATTI.", W / 2, 365);

  // Linea dorata centrale
  ctx.fillStyle = "#f0b516";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 60, 395, 120, 4, 2);
  ctx.fill();

  ctx.font = "18px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.fillText("Dalle conferenze stampa al calciomercato, tutto in 60 secondi.", W / 2, 435);
  ctx.restore();

  // 4 Carte Feature Editoriale (2x2 Grid)
  const features = [
    { icon: "⚡", title: "BREAKING NEWS", desc: "Super Sunto AI in 3 frasi integre senza gossip." },
    { icon: "⏱️", title: "FORMAZIONI LIVE", desc: "Campetto tattico, ballottaggi e voti in diretta." },
    { icon: "📊", title: "PAGELLE & STATS", desc: "Analisi data-driven delle partite e dei singoli." },
    { icon: "🎙️", title: "VIRGOLETTATI TOP", desc: "Le dichiarazioni integrali di mister e calciatori." },
  ];

  const gridPadX = 80;
  const colW = (W - gridPadX * 2 - 24) / 2; // ~448px
  const rowH = 140;

  for (let i = 0; i < features.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = gridPadX + col * (colW + 24);
    const fy = 490 + row * (rowH + 20);

    ctx.save();
    // Card background
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.strokeStyle = "rgba(240, 181, 22, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(fx, fy, colW, rowH, 16);
    ctx.fill();
    ctx.stroke();

    // Top gold line accent
    ctx.fillStyle = "#f0b516";
    ctx.beginPath();
    ctx.roundRect(fx + 20, fy, 40, 3, [0, 0, 2, 2]);
    ctx.fill();

    // Icona
    ctx.font = "26px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(features[i].icon, fx + 24, fy + 48);

    // Titolo
    ctx.font = "900 17px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(features[i].title, fx + 68, fy + 46);

    // Descrizione
    ctx.font = "14px Arial, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText(features[i].desc, fx + 24, fy + 90);

    ctx.restore();
  }

  // Box CTA Elegante in basso
  const ctaBoxY = 840;
  const ctaBoxH = 270;
  const ctaBoxW = W - gridPadX * 2;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 15;

  ctx.fillStyle = "rgba(20, 3, 6, 0.85)";
  ctx.strokeStyle = "#f0b516";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(gridPadX, ctaBoxY, ctaBoxW, ctaBoxH, 24);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = "transparent";

  // Claim sopra URL
  ctx.font = "bold 15px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText("ACCEDI ORA DA QUALSIASI DISPOSITIVO", W / 2, ctaBoxY + 55);

  // URL Gigante Dorato
  ctx.font = "900 62px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.letterSpacing = "2px";
  ctx.fillText("ROMAFLASH.APP", W / 2, ctaBoxY + 130);

  // Bottone Pillola Nero & Oro
  const subBtnW = 440;
  const subBtnH = 54;
  ctx.fillStyle = "#f0b516";
  ctx.beginPath();
  ctx.roundRect((W - subBtnW) / 2, ctaBoxY + 175, subBtnW, subBtnH, 27);
  ctx.fill();

  ctx.font = "900 17px Arial, sans-serif";
  ctx.fillStyle = "#180307";
  ctx.fillText("SCOPRI IL SITO UFFICIALE ➔", W / 2, ctaBoxY + 175 + 34);

  ctx.restore();

  // Footer
  ctx.save();
  ctx.font = "13px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.textAlign = "center";
  ctx.fillText("Disponibile su Safari, Chrome e tutti i browser mobile • Zero registrazione", W / 2, 1180);
  ctx.fillText("© RomaFlash — Testata Giallorossa Indipendente", W / 2, 1210);
  ctx.restore();

  saveCanvas(canvas, "outro_opzione_2_minimal_editorial.jpg");
}

/**
 * =========================================================================
 * OPZIONE 3: "Breaking App Hero / Giant Smartphone"
 * Smartphone protagonista gigante ad altissima risoluzione con feed reale
 * =========================================================================
 */
async function generateOption3() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Sfondo Rosso Imperiale Vignette con bagliore neon
  const bgGrad = ctx.createRadialGradient(W / 2, H * 0.52, 60, W / 2, H * 0.52, 750);
  bgGrad.addColorStop(0, "#73101b");
  bgGrad.addColorStop(0.6, "#38060d");
  bgGrad.addColorStop(1, "#120204");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Halo luminoso dorato dietro al telefono
  const phoneHalo = ctx.createRadialGradient(W / 2, 540, 50, W / 2, 540, 440);
  phoneHalo.addColorStop(0, "rgba(240, 181, 22, 0.28)");
  phoneHalo.addColorStop(1, "transparent");
  ctx.fillStyle = phoneHalo;
  ctx.fillRect(0, 0, W, H);

  // Header: Logo centrato e compatto
  drawCrest(ctx, W / 2, 95, 62);

  ctx.save();
  ctx.font = "900 24px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("IL TUO FEED QUOTIDIANO SULLA MAGICA", W / 2, 188);
  ctx.restore();

  // GIGANTE SMARTPHONE CENTRALE (Width: 460px, Height: 750px)
  const phW = 460;
  const phH = 750;
  const phX = (W - phW) / 2;
  const phY = 220;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 55;
  ctx.shadowOffsetY = 30;

  // Scocca esterna Titanio
  ctx.fillStyle = "#1e2024";
  ctx.beginPath();
  ctx.roundRect(phX, phY, phW, phH, 50);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.shadowColor = "transparent";

  // Schermo
  const sX = phX + 13;
  const sY = phY + 13;
  const sW = phW - 26;
  const sH = phH - 26;

  ctx.fillStyle = "#0c0204";
  ctx.beginPath();
  ctx.roundRect(sX, sY, sW, sH, 40);
  ctx.fill();

  // Dynamic Island
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.roundRect(phX + phW / 2 - 46, sY + 14, 92, 24, 12);
  ctx.fill();

  // Header app
  ctx.fillStyle = "#180307";
  ctx.fillRect(sX, sY + 48, sW, 52);
  ctx.font = "900 16px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.textAlign = "left";
  ctx.fillText("🐺 ROMAFLASH", sX + 22, sY + 80);

  // Tabs orizzontali app
  ctx.font = "bold 11px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.fillText("TUTTE", sX + 185, sY + 80);
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillText("CAMPO", sX + 245, sY + 80);
  ctx.fillText("MERCATO", sX + 310, sY + 80);

  ctx.fillStyle = "#f0b516";
  ctx.fillRect(sX + 183, sY + 92, 45, 2.5);

  // Match Live Ticker Card
  ctx.fillStyle = "#22050b";
  ctx.beginPath();
  ctx.roundRect(sX + 16, sY + 115, sW - 32, 60, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(240, 181, 22, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = "bold 10px Arial, sans-serif";
  ctx.fillStyle = "#e02d47";
  ctx.fillText("● SERIE A TIM", sX + 28, sY + 138);

  ctx.font = "900 15px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("ROMA 2 - 0 FIORENTINA", sX + 28, sY + 158);

  // Breaking Card Gigante
  ctx.fillStyle = "#1c0409";
  ctx.beginPath();
  ctx.roundRect(sX + 16, sY + 190, sW - 32, 280, 16);
  ctx.fill();

  ctx.fillStyle = "#2d0810";
  ctx.beginPath();
  ctx.roundRect(sX + 24, sY + 200, sW - 48, 140, 10);
  ctx.fill();

  // Lupetto watermark
  ctx.save();
  ctx.translate(sX + sW / 2 - 35, sY + 230);
  ctx.scale(70 / 512, 70 / 512);
  ctx.fillStyle = "rgba(240, 181, 22, 0.28)";
  ctx.fill(new Path2D(WOLF_SVG));
  ctx.restore();

  ctx.font = "900 16px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("DYBALA RINNOVA: L'ACCORDO", sX + 28, sY + 372);
  ctx.font = "12px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText("Tutte le cifre e i retroscena della firma.", sX + 28, sY + 395);

  // Pillola Sondaggio
  ctx.fillStyle = "rgba(240, 181, 22, 0.15)";
  ctx.beginPath();
  ctx.roundRect(sX + 28, sY + 418, sW - 56, 32, 8);
  ctx.fill();
  ctx.font = "bold 11px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.fillText("📊 SONDAGGIO: 92% VOTI FAVOREVOLI", sX + 40, sY + 438);

  // Card News 2
  ctx.fillStyle = "#160306";
  ctx.beginPath();
  ctx.roundRect(sX + 16, sY + 486, sW - 32, 170, 16);
  ctx.fill();
  ctx.font = "900 14px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("PAGELLE: KONE E SVILAR TRA I MIGLIORI", sX + 28, sY + 520);

  // Home indicator
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(phX + phW / 2 - 50, phY + phH - 20, 100, 4, 2);
  ctx.fill();

  ctx.restore();

  // Floating Neon Badges
  const drawBadge = (x, y, text, color) => {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#120205";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, 170, 44, 22);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 12px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 85, y + 22);
    ctx.restore();
  };

  drawBadge(60, 340, "🟢 ONLINE 24/7", "#10b981");
  drawBadge(W - 230, 420, "⚡ SUPER SUNTO", "#f0b516");
  drawBadge(50, 720, "📱 WEB APP LIVE", "#f0b516");
  drawBadge(W - 240, 780, "🐺 100% ROMA", "#e02d47");

  // Call to action finale in basso
  const ctaY = 1010;
  ctx.save();
  ctx.font = "900 38px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 15;
  ctx.fillText("SALVA IL SITO NEI TUOI PREFERITI", W / 2, ctaY);
  ctx.restore();

  // Pulsantone ORO a tutta larghezza
  const btnW = 860;
  const btnH = 92;
  const btnX = (W - btnW) / 2;
  const btnY = 1050;

  ctx.save();
  ctx.shadowColor = "rgba(240, 181, 22, 0.35)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = "#f0b516";
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 20);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.font = "900 38px Arial, sans-serif";
  ctx.fillStyle = "#180307";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "2px";
  ctx.fillText("WWW.ROMAFLASH.APP ➔", W / 2, btnY + btnH / 2);
  ctx.restore();

  // Microcopy
  ctx.save();
  ctx.font = "bold 15px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.textAlign = "center";
  ctx.fillText("Tocca il link in Bio o digitalo dal tuo browser", W / 2, 1180);
  ctx.restore();

  saveCanvas(canvas, "outro_opzione_3_app_hero.jpg");
}

/**
 * =========================================================================
 * OPZIONE 4: "Streetwear / Fan Poster & Big Typography"
 * Poster sportivo ad alto impatto (stile 433 / Nike Football / Mundial)
 * =========================================================================
 */
async function generateOption4() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Sfondo scuro carminio grunge
  ctx.fillStyle = "#140205";
  ctx.fillRect(0, 0, W, H);

  // Tipografia GIGANTE in background outline
  ctx.save();
  ctx.font = "900 240px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(240, 181, 22, 0.06)";
  ctx.lineWidth = 3;
  ctx.strokeText("ROMA", W / 2, 280);
  ctx.strokeText("FLASH", W / 2, 540);
  ctx.restore();

  // Bagliore radiale dorato al centro
  const rad = ctx.createRadialGradient(W / 2, 420, 30, W / 2, 420, 500);
  rad.addColorStop(0, "rgba(240, 181, 22, 0.2)");
  rad.addColorStop(1, "transparent");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);

  // STEMMA CENTRALE GIGANTE PROTAGONISTA (Diametro 280px)
  drawCrest(ctx, W / 2, 410, 140);

  // Titoli Punchy Streetwear
  ctx.save();
  ctx.font = "900 52px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 20;
  ctx.fillText("NON SEGUIRE IL RUMORE.", W / 2, 630);

  ctx.font = "900 52px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.fillText("LEGGI IL FLASH.", W / 2, 695);
  ctx.restore();

  // 3 Pillole Stile "Stamp" / Streetwear Tag
  const tags = [
    "🐺 100% CUORE GIALLOROSSO",
    "⚡ 30 SECONDI PER SAPERE TUTTO",
    "🚫 ZERO PUBBLICITÀ INVASIVE",
  ];

  for (let i = 0; i < tags.length; i++) {
    const ty = 770 + i * 65;
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = "#f0b516";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 270, ty, 540, 50, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = "900 16px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "1px";
    ctx.fillText(tags[i], W / 2, ty + 25);
    ctx.restore();
  }

  // Industrial / Bold CTA Block in basso
  const ctaY = 1010;
  const ctaH = 150;
  const ctaW = W - 140;
  const ctaX = 70;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 15;

  ctx.fillStyle = "#0c0204";
  ctx.strokeStyle = "#f0b516";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 18);
  ctx.fill();
  ctx.stroke();

  // Strisce d'allerta gialle/nere decorative sui lati
  ctx.fillStyle = "#f0b516";
  ctx.fillRect(ctaX, ctaY, 14, ctaH);
  ctx.fillRect(ctaX + ctaW - 14, ctaY, 14, ctaH);

  ctx.shadowColor = "transparent";
  ctx.font = "bold 16px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText("IL TUO QUOTIDIANO ONLINE GRATUITO", W / 2, ctaY + 45);

  ctx.font = "900 52px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.letterSpacing = "2px";
  ctx.fillText("ROMAFLASH.APP ➔", W / 2, ctaY + 105);

  ctx.restore();

  saveCanvas(canvas, "outro_opzione_4_poster_typography.jpg");
}

/**
 * =========================================================================
 * OPZIONE 5: "Digital Matchday Pass / VIP Season Ticket"
 * Concept unico ed esclusivo: il pass digitale dello stadio per i romanisti
 * =========================================================================
 */
async function generateOption5() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Sfondo tunnel / stadio notturno
  ctx.fillStyle = "#0b0103";
  ctx.fillRect(0, 0, W, H);

  const rad = ctx.createRadialGradient(W / 2, 450, 40, W / 2, 450, 700);
  rad.addColorStop(0, "rgba(120, 20, 32, 0.5)");
  rad.addColorStop(0.7, "rgba(25, 3, 6, 0.8)");
  rad.addColorStop(1, "#070002");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.save();
  ctx.font = "900 22px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.textAlign = "center";
  ctx.letterSpacing = "4px";
  ctx.fillText("PASS STAGIONALE DIGITALE", W / 2, 90);
  ctx.restore();

  // THE DIGITAL PASS TICKET CARD (Width: 640px, Height: 780px)
  const passW = 660;
  const passH = 780;
  const passX = (W - passW) / 2;
  const passY = 130;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;

  // Sfondo Ticket: gradiente oro/carminio scuro
  const passGrad = ctx.createLinearGradient(passX, passY, passX + passW, passY + passH);
  passGrad.addColorStop(0, "#2a050d");
  passGrad.addColorStop(0.5, "#180206");
  passGrad.addColorStop(1, "#120204");
  ctx.fillStyle = passGrad;
  ctx.beginPath();
  ctx.roundRect(passX, passY, passW, passH, 28);
  ctx.fill();

  ctx.strokeStyle = "rgba(240, 181, 22, 0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.shadowColor = "transparent";

  // Nastro giallo/rosso in alto al pass
  ctx.fillStyle = "#f0b516";
  ctx.fillRect(passX, passY, passW, 8);
  ctx.fillStyle = "#8e1b23";
  ctx.fillRect(passX, passY + 8, passW, 8);

  // Logo nel pass
  drawCrest(ctx, W / 2, passY + 115, 68);

  ctx.font = "900 24px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  ctx.fillText("ROMAFLASH DIGITAL PASS", W / 2, passY + 220);

  ctx.font = "bold 13px Arial, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.letterSpacing = "3px";
  ctx.fillText("ACCESSO TOTALE • STAGIONE 2026/27", W / 2, passY + 248);

  // Linea tratteggiata di strappo del biglietto
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(passX + 30, passY + 275);
  ctx.lineTo(passX + passW - 30, passY + 275);
  ctx.stroke();
  ctx.setLineDash([]);

  // Campi Dati del Pass (Tabella di lusso)
  const fields = [
    { label: "SETTORE", val: "CURVA DIGITALE GIALLOROSSA" },
    { label: "COPERTURA", val: "NEWS • FORMAZIONI • MERCATO 24/7" },
    { label: "VELOCITÀ", val: "SUPER SUNTO AI IN 60 SECONDI" },
    { label: "TARIFFA", val: "100% GRATUITO • ZERO REGISTRAZIONE" },
  ];

  for (let i = 0; i < fields.length; i++) {
    const fy = passY + 310 + i * 66;

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.beginPath();
    ctx.roundRect(passX + 40, fy, passW - 80, 52, 10);
    ctx.fill();

    ctx.font = "bold 11px Arial, sans-serif";
    ctx.fillStyle = "#f0b516";
    ctx.textAlign = "left";
    ctx.fillText(fields[i].label, passX + 60, fy + 22);

    ctx.font = "900 13px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(fields[i].val, passX + 60, fy + 40);
  }

  // Finto Barcode / QR al fondo del biglietto
  const bcY = passY + 590;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(passX + 60, bcY, passW - 120, 80, 8);
  ctx.fill();

  // Disegna barre codice
  ctx.fillStyle = "#0c0204";
  for (let bx = passX + 80; bx < passX + passW - 80; bx += 8) {
    const barW = (bx % 3 === 0) ? 4 : 2;
    ctx.fillRect(bx, bcY + 12, barW, 42);
  }

  ctx.font = "bold 11px monospace";
  ctx.fillStyle = "#0c0204";
  ctx.textAlign = "center";
  ctx.fillText("VALIDATION CODE: ROMAFLASH-2026-LIVE", W / 2, bcY + 68);

  ctx.restore();

  // CTA Finale in basso
  ctx.save();
  ctx.font = "900 36px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 15;
  ctx.fillText("ATTIVA IL TUO PASS SU BROWSER", W / 2, 970);
  ctx.restore();

  // Pulsante Primario ORO
  const btnW = 760;
  const btnH = 90;
  const btnX = (W - btnW) / 2;
  const btnY = 1010;

  ctx.save();
  ctx.shadowColor = "rgba(240, 181, 22, 0.4)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = "#f0b516";
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 45);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.font = "900 32px Arial, sans-serif";
  ctx.fillStyle = "#180307";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("👉 ENTRA SU WWW.ROMAFLASH.APP", W / 2, btnY + btnH / 2);
  ctx.restore();

  // Subtitle
  ctx.save();
  ctx.font = "14px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.textAlign = "center";
  ctx.fillText("Accessibile all'istante da qualsiasi smartphone • Nessun download", W / 2, 1140);
  ctx.restore();

  saveCanvas(canvas, "outro_opzione_5_digital_pass.jpg");
}

async function main() {
  console.log("Generating 5 Outro Options...");
  await generateOption1();
  await generateOption2();
  await generateOption3();
  await generateOption4();
  await generateOption5();
  console.log("All 5 options generated successfully!");
}

main().catch(console.error);
