import { createCanvas, Path2D } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";

const W = 1080;
const H = 1350;

const WOLF_SVG =
  "M179.3 38.94C154.7 77.7 142.7 139.7 168.4 185.9l-16.3 9.2c-6.7-11.9-11.2-24.4-13.9-37.2c-34.5-6.3-69.42-7.5-104.98-2.1c34.07 10.1 52.77 23.7 76.68 46.7c-26.82 9.7-60.25 30.2-92.93 70.2c35.47-8.8 64.83-11.5 89.43-6.3c-36.94 22.5-64.06 56.1-88.34 114.1c35.9-17.2 64.89-18.8 102.94-18.8c-23.07 32.7-35.27 77.2-36.31 112.8c24.51-26 57.61-60.2 87.21-79c3 29.9 15 58.3 35.9 85.3c-.2-43.9 10.3-88.3 31.6-133.4c-18.8 9-32.4 18.1-49.9 29.3c6.2-27.9 12.4-55.8 18.7-83.7c-23.3 2.4-39 10-60.5 18.5c16.3-33.1 32.7-66.1 49.1-99.2l16.8 8.3l-28.4 57.4c18.4-4.4 28.7-4.1 45.7-1.3c-4.5 20.4-9 40.7-13.6 61c65.3-36.2 148.3-45.9 226.7-50c7.6-12.9 13.8-24.2 18.8-34.8l-6.3-24.4l-24.4 30.8l-7.8-27.5l-22.5 29.2l-7.5-26.1l-23.9 31.5l-7.7-28.2l-23.8 31.4l1.2-41.1l22.6-42.7l7.6 28.3l23.9-31.5l7.6 28.2l23.5-30l6.5 26.9l24.5-30.8l7.8 27.5l24.6-32c2.3-10.8 4.6-22.4 7.4-35.7c-55.5-3.7-106.3 4.8-154 9.8c-38-20.8-80.8-26.8-121.9-18.5c-13.6-29.69-27.2-59.38-40.9-89.06M325.5 158.3c-4.5 14.2-13 18.3-24.7 20.6c-16.1-4.4-28.3-15.5-34.4-30.2c20.4-3.8 42.4 3.4 59.1 9.6";

const ARTIFACT_DIR = "C:/Users/simone.barbieri/.gemini/antigravity/brain/9f4d8b59-c278-4cfd-9963-f1b903fa5f16";
const PUBLIC_DIR = "c:/Users/simone.barbieri/.gemini/antigravity/scratch/romaflash/public/images/outro_options";

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
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = Math.round(r * 0.28);
  ctx.shadowOffsetY = Math.round(r * 0.08);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#220409";
  ctx.fill();

  ctx.shadowColor = "transparent";

  // Gold outer ring
  ctx.lineWidth = Math.max(4, Math.round(r * 0.07));
  ctx.strokeStyle = "#f5b800";
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
  ctx.fillStyle = "#f5b800";
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
 * MOCKUP A: ROSSO ROMA IMPERIALE VIBRANTE + CORNICE ORO DOPPIA
 * Massimo contrasto sui social (stacca nettamente dal nero delle app)
 * =========================================================================
 */
async function generateMockupA() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // 1. Sfondo Rosso Roma Imperiale Vivo con Gradiente Radiale Caldo
  const bgGrad = ctx.createRadialGradient(W / 2, 430, 40, W / 2, 430, 850);
  bgGrad.addColorStop(0, "#a81928");   // Rosso Roma caldo e acceso al centro
  bgGrad.addColorStop(0.45, "#78101c"); // Porpora cardinalizio
  bgGrad.addColorStop(0.8, "#3e060d");  // Sfumatura profonda
  bgGrad.addColorStop(1, "#1c0307");    // Bordo controllato
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Faint Dynamic Rays dorati di sottofondo
  ctx.save();
  ctx.strokeStyle = "rgba(245, 184, 0, 0.045)";
  ctx.lineWidth = 14;
  for (let i = -W; i < W * 2; i += 65) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H * 0.6, H);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Tipografia gigante outline in background (più visibile grazie al contrasto)
  ctx.save();
  ctx.font = "900 240px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(245, 184, 0, 0.09)";
  ctx.lineWidth = 3.5;
  ctx.strokeText("ROMA", W / 2, 280);
  ctx.strokeText("FLASH", W / 2, 540);
  ctx.restore();

  // 4. Bagliore di luce dorato caldo dietro lo stemma
  const halo = ctx.createRadialGradient(W / 2, 410, 20, W / 2, 410, 420);
  halo.addColorStop(0, "rgba(245, 184, 0, 0.32)");
  halo.addColorStop(0.6, "rgba(245, 184, 0, 0.08)");
  halo.addColorStop(1, "transparent");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // 5. CORNICE PERIMETRALE DORATA (Stacca il post dallo sfondo nero di TikTok/Instagram)
  ctx.save();
  ctx.strokeStyle = "rgba(245, 184, 0, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(24, 24, W - 48, H - 48, 20);
  ctx.stroke();

  // Angoli decorativi rinforzati oro
  const cornerLen = 40;
  ctx.strokeStyle = "#f5b800";
  ctx.lineWidth = 4;
  // Top-Left
  ctx.beginPath();
  ctx.moveTo(24, 24 + cornerLen);
  ctx.lineTo(24, 24);
  ctx.lineTo(24 + cornerLen, 24);
  ctx.stroke();
  // Top-Right
  ctx.beginPath();
  ctx.moveTo(W - 24 - cornerLen, 24);
  ctx.lineTo(W - 24, 24);
  ctx.lineTo(W - 24, 24 + cornerLen);
  ctx.stroke();
  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(24, H - 24 - cornerLen);
  ctx.lineTo(24, H - 24);
  ctx.lineTo(24 + cornerLen, H - 24);
  ctx.stroke();
  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(W - 24 - cornerLen, H - 24);
  ctx.lineTo(W - 24, H - 24);
  ctx.lineTo(W - 24, H - 24 - cornerLen);
  ctx.stroke();
  ctx.restore();

  // 6. STEMMA CENTRALE GIGANTE PROTAGONISTA (Diametro 280px)
  drawCrest(ctx, W / 2, 410, 140);

  // 7. Titoli Punchy Streetwear
  ctx.save();
  ctx.font = "900 52px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 4;
  ctx.fillText("NON SEGUIRE IL RUMORE.", W / 2, 630);

  ctx.font = "900 52px Arial, sans-serif";
  ctx.fillStyle = "#f5b800";
  ctx.shadowBlur = 22;
  ctx.fillText("LEGGI IL FLASH.", W / 2, 695);
  ctx.restore();

  // 8. 3 Pillole Stile "Stamp" / Streetwear Tag con bagliore
  const tags = [
    "🐺 100% CUORE GIALLOROSSO",
    "⚡ 30 SECONDI PER SAPERE TUTTO",
    "🚫 ZERO PUBBLICITÀ INVASIVE",
  ];

  for (let i = 0; i < tags.length; i++) {
    const ty = 765 + i * 65;
    ctx.save();
    ctx.fillStyle = "rgba(18, 2, 5, 0.65)";
    ctx.strokeStyle = "#f5b800";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 270, ty, 540, 50, 10);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.font = "900 16px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "1px";
    ctx.fillText(tags[i], W / 2, ty + 25);
    ctx.restore();
  }

  // 9. Industrial / Bold CTA Block in basso
  const ctaY = 1010;
  const ctaH = 155;
  const ctaW = W - 140;
  const ctaX = 70;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 16;

  ctx.fillStyle = "#0c0204";
  ctx.strokeStyle = "#f5b800";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 18);
  ctx.fill();
  ctx.stroke();

  // Strisce d'allerta gialle/oro decorative sui lati
  ctx.fillStyle = "#f5b800";
  ctx.fillRect(ctaX, ctaY, 14, ctaH);
  ctx.fillRect(ctaX + ctaW - 14, ctaY, 14, ctaH);

  ctx.shadowColor = "transparent";
  ctx.font = "bold 16px Arial, sans-serif";
  ctx.fillStyle = "#f5b800";
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText("IL TUO QUOTIDIANO ONLINE GRATUITO", W / 2, ctaY + 48);

  ctx.font = "900 54px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.letterSpacing = "2px";
  ctx.fillText("WWW.ROMAFLASH.APP ➔", W / 2, ctaY + 110);
  ctx.restore();

  saveCanvas(canvas, "mockup_outro_opzione_4_vibrante_con_cornice.jpg");
}

/**
 * =========================================================================
 * MOCKUP B: ROSSO ROMA VIBRANTE CON BAGLIORE (SENZA CORNICE)
 * Più pulito ed essenziale, con sfondo rosso vivo sfumato
 * =========================================================================
 */
async function generateMockupB() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Gradiente Rosso Roma vivace
  const bgGrad = ctx.createRadialGradient(W / 2, 450, 50, W / 2, 450, 850);
  bgGrad.addColorStop(0, "#9c1725");   // Rosso cardinalizio caldo
  bgGrad.addColorStop(0.5, "#680d17");
  bgGrad.addColorStop(0.85, "#30050b");
  bgGrad.addColorStop(1, "#180205");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Bagliore oro
  const halo = ctx.createRadialGradient(W / 2, 410, 30, W / 2, 410, 480);
  halo.addColorStop(0, "rgba(245, 184, 0, 0.28)");
  halo.addColorStop(0.7, "rgba(245, 184, 0, 0.05)");
  halo.addColorStop(1, "transparent");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // Tipografia outline
  ctx.save();
  ctx.font = "900 240px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(245, 184, 0, 0.08)";
  ctx.lineWidth = 3.5;
  ctx.strokeText("ROMA", W / 2, 280);
  ctx.strokeText("FLASH", W / 2, 540);
  ctx.restore();

  // Stemma
  drawCrest(ctx, W / 2, 410, 140);

  // Titoli
  ctx.save();
  ctx.font = "900 52px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
  ctx.shadowBlur = 22;
  ctx.fillText("NON SEGUIRE IL RUMORE.", W / 2, 630);

  ctx.font = "900 52px Arial, sans-serif";
  ctx.fillStyle = "#f5b800";
  ctx.fillText("LEGGI IL FLASH.", W / 2, 695);
  ctx.restore();

  // 3 Pillole
  const tags = [
    "🐺 100% CUORE GIALLOROSSO",
    "⚡ 30 SECONDI PER SAPERE TUTTO",
    "🚫 ZERO PUBBLICITÀ INVASIVE",
  ];

  for (let i = 0; i < tags.length; i++) {
    const ty = 765 + i * 65;
    ctx.save();
    ctx.fillStyle = "rgba(16, 2, 5, 0.6)";
    ctx.strokeStyle = "#f5b800";
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

  // CTA Box
  const ctaY = 1010;
  const ctaH = 155;
  const ctaW = W - 140;
  const ctaX = 70;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 16;

  ctx.fillStyle = "#0c0204";
  ctx.strokeStyle = "#f5b800";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f5b800";
  ctx.fillRect(ctaX, ctaY, 14, ctaH);
  ctx.fillRect(ctaX + ctaW - 14, ctaY, 14, ctaH);

  ctx.shadowColor = "transparent";
  ctx.font = "bold 16px Arial, sans-serif";
  ctx.fillStyle = "#f5b800";
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText("IL TUO QUOTIDIANO ONLINE GRATUITO", W / 2, ctaY + 48);

  ctx.font = "900 54px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.letterSpacing = "2px";
  ctx.fillText("WWW.ROMAFLASH.APP ➔", W / 2, ctaY + 110);
  ctx.restore();

  saveCanvas(canvas, "mockup_outro_opzione_4_vibrante_senza_cornice.jpg");
}

async function main() {
  console.log("Generating Mockup A & B...");
  await generateMockupA();
  await generateMockupB();
  console.log("Mockups generated!");
}

main().catch(console.error);
