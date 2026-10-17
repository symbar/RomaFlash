"use client";

export const SLIDE_W = 1080;
export const SLIDE_H = 1350; // 4:5 standard portrait format for TikTok & Instagram Carousels
export const STORY_W = 1080;
export const STORY_H = 1920; // 9:16 vertical format for Instagram Stories

export const WOLF_LOGO_SVG_PATH =
  "M179.3 38.94C154.7 77.7 142.7 139.7 168.4 185.9l-16.3 9.2c-6.7-11.9-11.2-24.4-13.9-37.2c-34.5-6.3-69.42-7.5-104.98-2.1c34.07 10.1 52.77 23.7 76.68 46.7c-26.82 9.7-60.25 30.2-92.93 70.2c35.47-8.8 64.83-11.5 89.43-6.3c-36.94 22.5-64.06 56.1-88.34 114.1c35.9-17.2 64.89-18.8 102.94-18.8c-23.07 32.7-35.27 77.2-36.31 112.8c24.51-26 57.61-60.2 87.21-79c3 29.9 15 58.3 35.9 85.3c-.2-43.9 10.3-88.3 31.6-133.4c-18.8 9-32.4 18.1-49.9 29.3c6.2-27.9 12.4-55.8 18.7-83.7c-23.3 2.4-39 10-60.5 18.5c16.3-33.1 32.7-66.1 49.1-99.2l16.8 8.3l-28.4 57.4c18.4-4.4 28.7-4.1 45.7-1.3c-4.5 20.4-9 40.7-13.6 61c65.3-36.2 148.3-45.9 226.7-50c7.6-12.9 13.8-24.2 18.8-34.8l-6.3-24.4l-24.4 30.8l-7.8-27.5l-22.5 29.2l-7.5-26.1l-23.9 31.5l-7.7-28.2l-23.8 31.4l1.2-41.1l22.6-42.7l7.6 28.3l23.9-31.5l7.6 28.2l23.5-30l6.5 26.9l24.5-30.8l7.8 27.5l24.6-32c2.3-10.8 4.6-22.4 7.4-35.7c-55.5-3.7-106.3 4.8-154 9.8c-38-20.8-80.8-26.8-121.9-18.5c-13.6-29.69-27.2-59.38-40.9-89.06M325.5 158.3c-4.5 14.2-13 18.3-24.7 20.6c-16.1-4.4-28.3-15.5-34.4-30.2c20.4-3.8 42.4 3.4 59.1 9.6";

export function getCondensedFontFamily(): string {
  if (typeof document !== "undefined") {
    const computed = getComputedStyle(document.documentElement);
    const oswald = computed.getPropertyValue("--font-oswald").trim();
    const bebas = computed.getPropertyValue("--font-bebas").trim();
    if (oswald) return `${oswald}, Impact, "Arial Narrow", sans-serif`;
    if (bebas) return `${bebas}, Impact, "Arial Narrow", sans-serif`;
  }
  return `"Oswald", "Bebas Neue", Impact, "Arial Narrow", sans-serif`;
}

export async function ensureFontsLoaded(): Promise<void> {
  if (typeof document !== "undefined" && (document as any).fonts) {
    try {
      const ff = getCondensedFontFamily();
      await (document as any).fonts.load(`700 80px ${ff}`);
      await (document as any).fonts.ready;
    } catch {
      // ignore
    }
  }
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function toProxiedUrl(url: string | null | undefined): string {
  if (!url) return "/images/archive/roma-1.jpg";
  if (url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
}

/**
 * Disegna il logo tondo ufficiale di RomaFlash (posizionabile a piacere).
 */
export function drawCircularLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = Math.round(r * 0.25);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(r * 0.08);

  // Cerchio di base scuro
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#220409";
  ctx.fill();

  ctx.shadowColor = "transparent";

  // Anello esterno oro
  ctx.lineWidth = Math.max(4, Math.round(r * 0.07));
  ctx.strokeStyle = "#f0b516";
  ctx.stroke();

  // Anello interno carminio
  ctx.beginPath();
  ctx.arc(cx, cy, r - Math.round(r * 0.075), 0, Math.PI * 2);
  ctx.lineWidth = Math.max(2, Math.round(r * 0.03));
  ctx.strokeStyle = "rgba(224, 45, 71, 0.9)";
  ctx.stroke();

  // Lupetto in oro
  const wolfSize = r * 1.15;
  ctx.save();
  ctx.translate(cx - wolfSize / 2, cy - r * 0.65);
  const scale = wolfSize / 512;
  ctx.scale(scale, scale);
  const wolfPath = new Path2D(WOLF_LOGO_SVG_PATH);
  ctx.fillStyle = "#f0b516";
  ctx.fill(wolfPath);
  ctx.restore();

  // Testo ROMAFLASH
  ctx.font = `900 ${Math.round(r * 0.22)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("ROMAFLASH", cx, cy + r * 0.52);

  ctx.restore();
}

/**
 * Genera il Super Sunto completo dell'articolo (2-3 frasi integre, mai troncate).
 */
export function buildCompleteSuperSunto(article: any): string {
  const excerpt = (article?.ai_summary?.excerpt || "").replace(/\s+/g, " ").trim();
  const content = (article?.ai_summary?.content || "").replace(/\s+/g, " ").trim();

  if (excerpt && excerpt.length >= 110) {
    return excerpt;
  }

  // Estrae frasi complete dal content
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length >= 20);

  if (!excerpt && sentences.length > 0) {
    let acc = sentences[0];
    if (sentences[1] && (acc + " " + sentences[1]).length <= 320) {
      acc += " " + sentences[1];
    }
    return acc;
  }

  if (excerpt) {
    for (const s of sentences) {
      const normEx = excerpt.toLowerCase().slice(0, 28);
      const normS = s.toLowerCase().slice(0, 28);
      if (normS !== normEx && !excerpt.toLowerCase().includes(normS)) {
        const combined = `${excerpt} ${s}`;
        if (combined.length <= 320) {
          return combined;
        }
        break;
      }
    }
    return excerpt;
  }

  return "Tutti gli aggiornamenti, le formazioni e i dettagli in tempo reale sull'AS Roma.";
}

/**
 * =========================================================================
 * SLIDE 1: LOCANDINA NOTIZIA (1080x1350 4:5)
 * Standardizzata al 100% per TikTok & Instagram Feed/Caroselli
 * =========================================================================
 */
export function renderSlide1(
  article: any,
  bgImg: HTMLImageElement | null
): { dataUrl: string; filePromise: Promise<File | null> } {
  const canvas = document.createElement("canvas");
  canvas.width = SLIDE_W;
  canvas.height = SLIDE_H;
  const ctx = canvas.getContext("2d")!;

  // 1. Base Scura Profonda
  ctx.fillStyle = "#140407";
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  // 2. Foto Reale dell'Articolo in alto (inquadratura smart)
  if (bgImg && bgImg.width > 0 && bgImg.height > 0) {
    const targetH = 920;
    const scale = Math.max(SLIDE_W / bgImg.width, targetH / bgImg.height);
    const drawW = bgImg.width * scale;
    const drawH = bgImg.height * scale;
    const offsetX = (SLIDE_W - drawW) * 0.5;
    const offsetY = Math.min(0, (targetH - drawH) * 0.2);
    ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
  }

  // 3. Gradiente editoriale sfumato dal nero della foto al buio della base
  const grad = ctx.createLinearGradient(0, 0, 0, SLIDE_H);
  grad.addColorStop(0, "rgba(0, 0, 0, 0.25)");
  grad.addColorStop(0.18, "rgba(0, 0, 0, 0.0)");
  grad.addColorStop(0.42, "rgba(12, 2, 4, 0.25)");
  grad.addColorStop(0.56, "rgba(16, 3, 6, 0.84)");
  grad.addColorStop(0.7, "rgba(18, 3, 6, 0.96)");
  grad.addColorStop(1, "#120204");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  // 4. Logo Tondo Ufficiale RomaFlash in Alto a Sinistra
  drawCircularLogo(ctx, 96, 94, 72);

  // 5. Testo: Titolo Bicolore + Barra Oro + Super Sunto Completo
  const padX = 72;
  const maxW = SLIDE_W - padX * 2; // 936px
  const titleText = (article?.title || "Ultime Notizie AS Roma")
    .replace(/['’‘]/g, "'")
    .toUpperCase()
    .trim();
  const suntoText = buildCompleteSuperSunto(article);

  const condensedFont = getCondensedFontFamily();

  // Calcolo dinamico dimensione per fit perfetto
  let titleSize = 68;
  let suntoSize = 38;
  let titleLines: string[] = [];
  let suntoLines: string[] = [];
  let titleLineH = 74;
  let suntoLineH = 50;

  for (let step = 0; step < 8; step++) {
    ctx.font = `700 ${titleSize}px ${condensedFont}`;
    titleLines = wrapText(ctx, titleText, maxW);
    titleLineH = Math.round(titleSize * 1.08);

    ctx.font = `600 ${suntoSize}px system-ui, -apple-system, sans-serif`;
    suntoLines = wrapText(ctx, suntoText, maxW);
    suntoLineH = Math.round(suntoSize * 1.34);

    const totalBlockH =
      titleLines.length * titleLineH +
      38 +
      suntoLines.length * suntoLineH;

    if (totalBlockH <= 690 || (titleSize <= 48 && suntoSize <= 28)) {
      break;
    }
    titleSize -= 3;
    suntoSize -= 2;
  }

  const totalBlockH =
    titleLines.length * titleLineH +
    38 +
    suntoLines.length * suntoLineH;

  const bottomLimit = 1280;
  const minTop = 540;
  let y = Math.max(minTop, bottomLimit - totalBlockH);

  ctx.save();
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  // Titolo bicolore Bianco + Oro
  ctx.font = `700 ${titleSize}px ${condensedFont}`;
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 4;

  const splitTitleIdx = Math.ceil(titleLines.length / 2);
  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillStyle = i < splitTitleIdx ? "#ffffff" : "#f5b800";
    ctx.fillText(titleLines[i], padX, y);
    y += titleLineH;
  }

  // Barra di separazione Oro
  y += 14;
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#f5b800";
  ctx.beginPath();
  ctx.roundRect(padX, y, 140, 6, 3);
  ctx.fill();
  y += 24;

  // Super Sunto nitido
  ctx.font = `600 ${suntoSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  for (const line of suntoLines) {
    ctx.fillText(line, padX, y);
    y += suntoLineH;
  }
  ctx.restore();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const filePromise = new Promise<File | null>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        const shortId = article?.id ? String(article.id).slice(0, 8) : "news";
        const file = new File([blob], `romaflash-slide-1-${shortId}.jpg`, {
          type: "image/jpeg",
        });
        resolve(file);
      },
      "image/jpeg",
      0.95
    );
  });

  return { dataUrl, filePromise };
}

/**
 * =========================================================================
 * SLIDE 2: LOCANDINA OUTRO / CTA (1080x1350 4:5)
 * Ispirata al format di riferimento ("simile ma diversa"), 100% coordinata RomaFlash
 * con Logo Tondo al centro, Mockup Laptop & iPhone, Banner Dorato e Freccia
 * =========================================================================
 */
export function renderSlide2Outro(): {
  dataUrl: string;
  filePromise: Promise<File | null>;
} {
  const canvas = document.createElement("canvas");
  canvas.width = SLIDE_W;
  canvas.height = SLIDE_H;
  const ctx = canvas.getContext("2d")!;

  const W = SLIDE_W;
  const H = SLIDE_H;

  // 1. Sfondo Giallorosso Profondo con gradiente radiale
  const bgGrad = ctx.createRadialGradient(W / 2, H * 0.44, 80, W / 2, H * 0.44, 850);
  bgGrad.addColorStop(0, "#991b24"); // Rosso Roma imperiale
  bgGrad.addColorStop(0.5, "#5c0e18");
  bgGrad.addColorStop(0.85, "#2a040b");
  bgGrad.addColorStop(1, "#140205"); // Bordo elegante scurissimo
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Faint background diagonal dynamic rays
  ctx.save();
  ctx.strokeStyle = "rgba(240, 181, 22, 0.04)";
  ctx.lineWidth = 14;
  for (let i = -W; i < W * 2; i += 70) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H * 0.6, H);
    ctx.stroke();
  }
  ctx.restore();

  // Lupetto watermark gigante al centro
  ctx.save();
  ctx.translate(W / 2 - 240, H * 0.28);
  ctx.scale(480 / 512, 480 / 512);
  ctx.fillStyle = "rgba(240, 181, 22, 0.035)";
  ctx.fill(new Path2D(WOLF_LOGO_SVG_PATH));
  ctx.restore();

  // 2. Logo Tondo Ufficiale RomaFlash in Alto (Centrato, diametro 230px)
  drawCircularLogo(ctx, W / 2, 175, 115);

  // Sottotitolo elegante sotto il logo
  ctx.save();
  ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.textAlign = "center";
  ctx.letterSpacing = "4px";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 10;
  ctx.fillText("L'ESSENZA DELLE NOTIZIE GIALLOROSSE", W / 2, 310);
  ctx.restore();

  // 3. Mockup Dispositivi: Laptop (MacBook) + Smartphone (iPhone Pro)
  const laptopX = 130;
  const laptopY = 360;
  const laptopW = 540;
  const laptopH = 330;

  ctx.save();
  // Ombra Laptop
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 24;

  // Scocca Schermo Laptop
  ctx.fillStyle = "#1e2124";
  ctx.beginPath();
  ctx.roundRect(laptopX, laptopY, laptopW, laptopH, 18);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.shadowColor = "transparent";

  // Display Screen Laptop
  const screenX = laptopX + 16;
  const screenY = laptopY + 16;
  const screenW = laptopW - 32;
  const screenH = laptopH - 32;

  ctx.fillStyle = "#0c0204";
  ctx.beginPath();
  ctx.roundRect(screenX, screenY, screenW, screenH, 8);
  ctx.fill();

  // Header sito desktop
  ctx.fillStyle = "#1a0307";
  ctx.fillRect(screenX, screenY, screenW, 36);

  ctx.font = "900 13px system-ui, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.textAlign = "left";
  ctx.fillText("🐺 ROMAFLASH", screenX + 16, screenY + 23);

  ctx.font = "bold 9px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText("NEWS", screenX + 160, screenY + 23);
  ctx.fillText("FORMAZIONI", screenX + 215, screenY + 23);
  ctx.fillText("CALENDARIO", screenX + 295, screenY + 23);
  ctx.fillText("CLASSIFICA", screenX + 380, screenY + 23);

  ctx.fillStyle = "#f0b516";
  ctx.fillRect(screenX, screenY + 36, screenW, 2);

  // Hero Card sinistra desktop
  ctx.fillStyle = "#1e050a";
  ctx.beginPath();
  ctx.roundRect(screenX + 14, screenY + 50, screenW * 0.58, screenH - 64, 8);
  ctx.fill();

  ctx.fillStyle = "#e02d47";
  ctx.beginPath();
  ctx.roundRect(screenX + 26, screenY + 62, 70, 16, 4);
  ctx.fill();
  ctx.font = "900 8px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("ULTIM'ORA", screenX + 33, screenY + 73);

  ctx.font = "800 13px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("DYBALA GUIDA L'ATTACCO:", screenX + 26, screenY + 98);
  ctx.fillText("I DETTAGLI DI FORMAZIONE", screenX + 26, screenY + 115);

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillRect(screenX + 26, screenY + 132, screenW * 0.46, 5);
  ctx.fillRect(screenX + 26, screenY + 144, screenW * 0.42, 5);
  ctx.fillRect(screenX + 26, screenY + 156, screenW * 0.35, 5);

  // Colonna destra desktop
  for (let r = 0; r < 3; r++) {
    const ry = screenY + 50 + r * 68;
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.roundRect(screenX + screenW * 0.62, ry, screenW * 0.36, 58, 6);
    ctx.fill();

    ctx.fillStyle = "#f0b516";
    ctx.fillRect(screenX + screenW * 0.64, ry + 12, 50, 4);
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillRect(screenX + screenW * 0.64, ry + 24, screenW * 0.28, 6);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(screenX + screenW * 0.64, ry + 36, screenW * 0.22, 5);
  }

  // Base Tastiera Laptop
  ctx.fillStyle = "#2a2d32";
  ctx.beginPath();
  ctx.roundRect(laptopX - 44, laptopY + laptopH - 4, laptopW + 88, 22, [4, 4, 12, 12]);
  ctx.fill();

  ctx.fillStyle = "#181a1d";
  ctx.beginPath();
  ctx.roundRect(laptopX + laptopW / 2 - 40, laptopY + laptopH - 4, 80, 8, [0, 0, 4, 4]);
  ctx.fill();

  ctx.restore();

  // Smartphone Mockup (iPhone Pro) - In primo piano a destra
  const phoneX = 640;
  const phoneY = 320;
  const phoneW = 270;
  const phoneH = 550;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 48;
  ctx.shadowOffsetX = -10;
  ctx.shadowOffsetY = 28;

  ctx.fillStyle = "#1e2024";
  ctx.beginPath();
  ctx.roundRect(phoneX, phoneY, phoneW, phoneH, 44);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.shadowColor = "transparent";

  const pScrX = phoneX + 11;
  const pScrY = phoneY + 11;
  const pScrW = phoneW - 22;
  const pScrH = phoneH - 22;

  ctx.fillStyle = "#0a0103";
  ctx.beginPath();
  ctx.roundRect(pScrX, pScrY, pScrW, pScrH, 36);
  ctx.fill();

  // Dynamic Island
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.roundRect(phoneX + phoneW / 2 - 38, pScrY + 12, 76, 22, 11);
  ctx.fill();

  // Header mobile
  ctx.fillStyle = "#180307";
  ctx.fillRect(pScrX, pScrY + 44, pScrW, 46);

  ctx.font = "900 13px system-ui, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.textAlign = "center";
  ctx.fillText("🐺 ROMAFLASH", pScrX + pScrW / 2, pScrY + 70);

  // Card Notizia Top Mobile
  ctx.fillStyle = "#1f0409";
  ctx.beginPath();
  ctx.roundRect(pScrX + 12, pScrY + 104, pScrW - 24, 200, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(240, 181, 22, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#2d0810";
  ctx.beginPath();
  ctx.roundRect(pScrX + 18, pScrY + 110, pScrW - 36, 100, 10);
  ctx.fill();

  ctx.save();
  ctx.translate(pScrX + pScrW / 2 - 25, pScrY + 130);
  ctx.scale(50 / 512, 50 / 512);
  ctx.fillStyle = "rgba(240, 181, 22, 0.25)";
  ctx.fill(new Path2D(WOLF_LOGO_SVG_PATH));
  ctx.restore();

  ctx.font = "800 12px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText("CALCIOMERCATO & CAMPO", pScrX + 24, pScrY + 232);
  ctx.font = "bold 10px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.fillText("Tutte le formazioni e i voti live", pScrX + 24, pScrY + 252);

  ctx.fillStyle = "rgba(240, 181, 22, 0.15)";
  ctx.beginPath();
  ctx.roundRect(pScrX + 24, pScrY + 270, pScrW - 48, 22, 6);
  ctx.fill();
  ctx.font = "bold 9px system-ui, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.fillText("📊 SONDAGGIO: CHI VINCE SABATO?", pScrX + 32, pScrY + 284);

  // Seconda Card Mobile
  ctx.fillStyle = "#180408";
  ctx.beginPath();
  ctx.roundRect(pScrX + 12, pScrY + 316, pScrW - 24, 130, 16);
  ctx.fill();
  ctx.font = "800 11px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("PAGELLE & STATISTICHE", pScrX + 24, pScrY + 342);

  // Barra di navigazione inferiore
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(pScrX, pScrY + pScrH - 48, pScrW, 48);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(phoneX + phoneW / 2 - 45, phoneY + phoneH - 20, 90, 4, 2);
  ctx.fill();

  // Riflesso vetro
  const glass = ctx.createLinearGradient(pScrX, pScrY, pScrX + pScrW, pScrY + pScrH);
  glass.addColorStop(0, "rgba(255, 255, 255, 0.12)");
  glass.addColorStop(0.35, "rgba(255, 255, 255, 0.0)");
  glass.addColorStop(1, "rgba(255, 255, 255, 0.0)");
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.roundRect(pScrX, pScrY, pScrW, pScrH, 36);
  ctx.fill();

  ctx.restore();

  // 4. Testo Call to Action
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 52px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  ctx.fillText("Trovi tutti i dettagli su", W / 2, 940);
  ctx.restore();

  // 5. Bannerone ORO Giallorosso Pieno
  const bannerY = 1000;
  const bannerH = 126;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = "#f0b516";
  ctx.fillRect(0, bannerY, W, bannerH);

  ctx.fillStyle = "#8e1b23";
  ctx.fillRect(0, bannerY, W, 5);
  ctx.fillRect(0, bannerY + bannerH - 5, W, 5);

  ctx.shadowColor = "transparent";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 70px system-ui, -apple-system, Impact, sans-serif";
  ctx.fillStyle = "#180307";
  ctx.letterSpacing = "2px";
  ctx.fillText("www.romaflash.app", W / 2, bannerY + bannerH / 2 + 3);

  ctx.restore();

  // 6. Freccia Gigante Dorata in Basso ➔
  const arrowY = 1220;
  const arrowStartX = W / 2 - 190;
  const arrowEndX = W / 2 + 190;
  const shaftH = 34;
  const headSize = 70;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;

  ctx.fillStyle = "#f0b516";
  ctx.beginPath();
  ctx.moveTo(arrowStartX, arrowY - shaftH / 2);
  ctx.lineTo(arrowEndX - headSize, arrowY - shaftH / 2);
  ctx.lineTo(arrowEndX - headSize, arrowY - headSize);
  ctx.lineTo(arrowEndX, arrowY);
  ctx.lineTo(arrowEndX - headSize, arrowY + headSize);
  ctx.lineTo(arrowEndX - headSize, arrowY + shaftH / 2);
  ctx.lineTo(arrowStartX, arrowY + shaftH / 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const filePromise = new Promise<File | null>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], `romaflash-slide-2-outro.jpg`, {
          type: "image/jpeg",
        });
        resolve(file);
      },
      "image/jpeg",
      0.95
    );
  });

  return { dataUrl, filePromise };
}

/**
 * =========================================================================
 * SLIDE STORIA 9:16 (1080x1920) - Per Storie Instagram con Sticker Link
 * =========================================================================
 */
export function renderStoryCanvas(
  article: any,
  bgImg: HTMLImageElement | null
): { dataUrl: string; filePromise: Promise<File | null> } {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0c0204";
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  if (bgImg && bgImg.width > 0 && bgImg.height > 0) {
    const targetH = 1140;
    const scale = Math.max(STORY_W / bgImg.width, targetH / bgImg.height);
    const drawW = bgImg.width * scale;
    const drawH = bgImg.height * scale;
    const offsetX = (STORY_W - drawW) * 0.5;
    const offsetY = Math.min(0, (targetH - drawH) * 0.15);
    ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
  }

  const grad = ctx.createLinearGradient(0, 0, 0, STORY_H);
  grad.addColorStop(0, "rgba(0, 0, 0, 0.5)");
  grad.addColorStop(0.18, "rgba(0, 0, 0, 0.12)");
  grad.addColorStop(0.42, "rgba(12, 2, 4, 0.42)");
  grad.addColorStop(0.56, "rgba(14, 2, 5, 0.85)");
  grad.addColorStop(0.68, "rgba(15, 2, 4, 0.96)");
  grad.addColorStop(1, "#0a0103");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  const radial = ctx.createRadialGradient(
    STORY_W / 2,
    STORY_H - 120,
    10,
    STORY_W / 2,
    STORY_H - 120,
    600
  );
  radial.addColorStop(0, "rgba(142, 27, 35, 0.55)");
  radial.addColorStop(1, "rgba(142, 27, 35, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, STORY_H - 600, STORY_W, 600);

  // Logo tondo ufficiale a sinistra
  const padX = 84;
  const logoR = 76;
  const logoCx = padX + logoR;
  const logoCy = 175;
  drawCircularLogo(ctx, logoCx, logoCy, logoR);

  const maxW = STORY_W - padX * 2;
  const titleRaw = (article?.title || "Ultime Notizie AS Roma")
    .replace(/['’‘]/g, "'")
    .toUpperCase();
  const fontFam = getCondensedFontFamily();

  let titleFontSize = 66;
  ctx.font = `900 ${titleFontSize}px ${fontFam}`;
  let titleLines = wrapText(ctx, titleRaw, maxW);

  if (titleLines.length > 4) {
    titleFontSize = 54;
    ctx.font = `900 ${titleFontSize}px ${fontFam}`;
    titleLines = wrapText(ctx, titleRaw, maxW);
  }

  const sunto = buildCompleteSuperSunto(article);
  ctx.font = "italic 32px Georgia, serif";
  const quoteLines = wrapText(ctx, `"${sunto}"`, maxW - 48);
  const quoteBoxH = quoteLines.length * 44 + 28;

  const stickerH = 80;
  const stickerY = 1680;
  const lineHeight = Math.round(titleFontSize * 1.22);
  const titleHeight = titleLines.length * lineHeight;

  let currentY = stickerY - 40 - quoteBoxH - 32 - titleHeight;
  if (currentY < 1040) currentY = 1040;

  // Titolo
  ctx.save();
  ctx.font = `900 ${titleFontSize}px ${fontFam}`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (const line of titleLines) {
    ctx.fillText(line, padX, currentY);
    currentY += lineHeight;
  }
  ctx.restore();

  // Box Sunto
  currentY += 24;
  const boxX = padX;
  const boxY = currentY;
  const boxW = maxW;

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, quoteBoxH, 16);
  ctx.fill();

  ctx.fillStyle = "#f0b516";
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, 8, quoteBoxH, [16, 0, 0, 16]);
  ctx.fill();

  ctx.font = "italic 30px Georgia, serif";
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  let qY = boxY + 18;
  for (const qLine of quoteLines) {
    ctx.fillText(qLine, boxX + 28, qY);
    qY += 40;
  }
  ctx.restore();

  // Sticker Mockup
  ctx.save();
  const stW = 620;
  const stX = (STORY_W - stW) / 2;
  const stY = stickerY;

  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(stX, stY, stW, stickerH, 40);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#8e1b23";
  ctx.beginPath();
  ctx.arc(stX + 46, stY + stickerH / 2, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🔗", stX + 46, stY + stickerH / 2);

  ctx.font = "900 24px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("TOCCA PER L'ARTICOLO", stX + 80, stY + stickerH / 2 - 2);

  ctx.font = "600 20px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("•  romaflash.app", stX + 400, stY + stickerH / 2 - 2);
  ctx.restore();

  // Footer
  ctx.save();
  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "2px";
  ctx.fillText("@ROMAFLASH 🐺", STORY_W / 2, 1810);
  ctx.restore();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const filePromise = new Promise<File | null>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        const shortId = article?.id ? String(article.id).slice(0, 8) : "news";
        const file = new File([blob], `romaflash-storia-9-16-${shortId}.jpg`, {
          type: "image/jpeg",
        });
        resolve(file);
      },
      "image/jpeg",
      0.95
    );
  });

  return { dataUrl, filePromise };
}
