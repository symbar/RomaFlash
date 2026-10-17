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
 * OPZIONE 4: Streetwear Poster & Big Typography
 * Tipografia gigante outline, stemma RomaFlash centrale (280px),
 * claim "Non seguire il rumore. Leggi il Flash.", 3 tag pill e CTA box.
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
  const condensedFont = getCondensedFontFamily();

  // 1. Sfondo Rosso Roma Imperiale Caldo e Luminoso (Mockup B)
  const bgGrad = ctx.createRadialGradient(W / 2, 450, 50, W / 2, 450, 850);
  bgGrad.addColorStop(0, "#9c1725");   // Rosso cardinalizio caldo
  bgGrad.addColorStop(0.5, "#680d17");
  bgGrad.addColorStop(0.85, "#30050b");
  bgGrad.addColorStop(1, "#180205");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Halo di luce dorata calda dietro lo stemma
  const halo = ctx.createRadialGradient(W / 2, 410, 30, W / 2, 410, 480);
  halo.addColorStop(0, "rgba(245, 184, 0, 0.28)");
  halo.addColorStop(0.7, "rgba(245, 184, 0, 0.05)");
  halo.addColorStop(1, "transparent");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // 3. Tipografia GIGANTE in background outline
  ctx.save();
  ctx.font = `900 240px ${condensedFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(245, 184, 0, 0.08)";
  ctx.lineWidth = 3.5;
  ctx.strokeText("ROMA", W / 2, 280);
  ctx.strokeText("FLASH", W / 2, 540);
  ctx.restore();

  // 4. STEMMA CENTRALE GIGANTE PROTAGONISTA (Diametro 280px)
  drawCircularLogo(ctx, W / 2, 410, 140);

  // 5. Claim Brand Ufficiale
  ctx.save();
  ctx.font = `900 52px ${condensedFont}`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 20;
  ctx.fillText("L'ESSENZA DELLE", W / 2, 630);

  ctx.font = `900 52px ${condensedFont}`;
  ctx.fillStyle = "#f5b800";
  ctx.fillText("NOTIZIE GIALLOROSSE", W / 2, 695);
  ctx.restore();

  // 6. 3 Pillole Stile "Stamp" / Streetwear Tag
  const tags = [
    "🐺 100% CUORE GIALLOROSSO",
    "⚡ 30 SECONDI PER SAPERE TUTTO",
    "🚫 ZERO PUBBLICITÀ INVASIVE",
  ];

  for (let i = 0; i < tags.length; i++) {
    const ty = 765 + i * 65;
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = "#f5b800";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 270, ty, 540, 50, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = "900 16px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "1px";
    ctx.fillText(tags[i], W / 2, ty + 25);
    ctx.restore();
  }

  // 7. Industrial / Bold CTA Block in basso
  const ctaY = 1010;
  const ctaH = 155;
  const ctaW = W - 140;
  const ctaX = 70;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 15;

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
  ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#f5b800";
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText("IL TUO QUOTIDIANO ONLINE GRATUITO", W / 2, ctaY + 48);

  ctx.font = `900 54px ${condensedFont}`;
  ctx.fillStyle = "#ffffff";
  ctx.letterSpacing = "2px";
  ctx.fillText("WWW.ROMAFLASH.APP ➔", W / 2, ctaY + 110);

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
 * Standardizzata graficamente al 100% con Slide 1 (Notizia + Super Sunto)
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

  // 1. Base Scura Profonda
  ctx.fillStyle = "#140407";
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // 2. Foto Reale in alto (copre fino a circa 1200px con zoom ideale)
  if (bgImg && bgImg.width > 0 && bgImg.height > 0) {
    const targetH = 1220;
    const scale = Math.max(STORY_W / bgImg.width, targetH / bgImg.height);
    const drawW = bgImg.width * scale;
    const drawH = bgImg.height * scale;
    const offsetX = (STORY_W - drawW) * 0.5;
    const offsetY = Math.min(0, (targetH - drawH) * 0.18);
    ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
  }

  // 3. Gradiente editoriale sfumato dal nero della foto al buio della base
  const grad = ctx.createLinearGradient(0, 0, 0, STORY_H);
  grad.addColorStop(0, "rgba(0, 0, 0, 0.3)");
  grad.addColorStop(0.16, "rgba(0, 0, 0, 0.0)");
  grad.addColorStop(0.38, "rgba(12, 2, 4, 0.28)");
  grad.addColorStop(0.52, "rgba(16, 3, 6, 0.82)");
  grad.addColorStop(0.66, "rgba(18, 3, 6, 0.96)");
  grad.addColorStop(1, "#120204");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Bagliore radiale carminio inferiore
  const radial = ctx.createRadialGradient(
    STORY_W / 2,
    STORY_H - 150,
    20,
    STORY_W / 2,
    STORY_H - 150,
    650
  );
  radial.addColorStop(0, "rgba(142, 27, 35, 0.45)");
  radial.addColorStop(1, "rgba(142, 27, 35, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, STORY_H - 650, STORY_W, 650);

  // 4. Logo Tondo Ufficiale RomaFlash in Alto a Sinistra (posizionato a safe area storie: cx=104, cy=140, r=72)
  drawCircularLogo(ctx, 104, 140, 72);

  // 5. Testi: Titolo Bicolore + Barra Oro + Super Sunto Completo
  const padX = 76;
  const maxW = STORY_W - padX * 2; // 928px
  const titleText = (article?.title || "Ultime Notizie AS Roma")
    .replace(/['’‘]/g, "'")
    .toUpperCase()
    .trim();
  const suntoText = buildCompleteSuperSunto(article);
  const condensedFont = getCondensedFontFamily();

  // Calcolo dinamico dimensione per fit perfetto sopra lo sticker
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

    if (totalBlockH <= 660 || (titleSize <= 46 && suntoSize <= 28)) {
      break;
    }
    titleSize -= 3;
    suntoSize -= 2;
  }

  const totalBlockH =
    titleLines.length * titleLineH +
    38 +
    suntoLines.length * suntoLineH;

  // Posizionamento verticale: sopra lo sticker link (che sta a y=1660)
  const stickerY = 1660;
  const bottomLimit = stickerY - 45; // 1615
  const minTop = 880;
  let y = Math.max(minTop, bottomLimit - totalBlockH);

  ctx.save();
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  // Titolo bicolore Bianco + Oro
  ctx.font = `700 ${titleSize}px ${condensedFont}`;
  ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
  ctx.shadowBlur = 14;
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

  // Super Sunto nitido (uguale a Slide 1 TikTok & Instagram 4:5!)
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

  // 6. Sticker Mockup Instagram Link
  const stickerH = 84;
  const stW = 660;
  const stX = (STORY_W - stW) / 2;
  const stY = stickerY;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(stX, stY, stW, stickerH, 42);
  ctx.fill();

  ctx.shadowColor = "transparent";

  // Badge icona link
  ctx.fillStyle = "#8e1b23";
  ctx.beginPath();
  ctx.arc(stX + 46, stY + stickerH / 2, 20, 0, Math.PI * 2);
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
  ctx.fillText("• romaflash.app", stX + 420, stY + stickerH / 2 - 2);
  ctx.restore();

  // 7. Footer elegante
  ctx.save();
  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "2px";
  ctx.fillText("@ROMAFLASH 🐺", STORY_W / 2, 1790);
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

/**
 * =========================================================================
 * SLIDE 2 STORIA 9:16 (1080x1920) - Outro / Invito a romaflash.app
 * OPZIONE 4: Streetwear Poster & Big Typography (Adattata per lo schermo verticale 9:16)
 * =========================================================================
 */
export function renderStorySlide2Outro(): {
  dataUrl: string;
  filePromise: Promise<File | null>;
} {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext("2d")!;

  const W = STORY_W;
  const H = STORY_H;
  const condensedFont = getCondensedFontFamily();

  // 1. Sfondo Rosso Roma Imperiale Caldo e Luminoso (Mockup B 9:16)
  const bgGrad = ctx.createRadialGradient(W / 2, 540, 60, W / 2, 540, 1100);
  bgGrad.addColorStop(0, "#9c1725");   // Rosso cardinalizio caldo
  bgGrad.addColorStop(0.5, "#680d17");
  bgGrad.addColorStop(0.85, "#30050b");
  bgGrad.addColorStop(1, "#180205");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Halo di luce dorata calda dietro lo stemma
  const halo = ctx.createRadialGradient(W / 2, 530, 40, W / 2, 530, 600);
  halo.addColorStop(0, "rgba(245, 184, 0, 0.28)");
  halo.addColorStop(0.7, "rgba(245, 184, 0, 0.05)");
  halo.addColorStop(1, "transparent");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // 3. Tipografia GIGANTE in background outline
  ctx.save();
  ctx.font = `900 280px ${condensedFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(245, 184, 0, 0.08)";
  ctx.lineWidth = 3.5;
  ctx.strokeText("ROMA", W / 2, 360);
  ctx.strokeText("FLASH", W / 2, 700);
  ctx.restore();

  // 4. STEMMA CENTRALE GIGANTE PROTAGONISTA (Diametro 320px)
  drawCircularLogo(ctx, W / 2, 530, 160);

  // 5. Claim Brand Ufficiale
  ctx.save();
  ctx.font = `900 60px ${condensedFont}`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 22;
  ctx.fillText("L'ESSENZA DELLE", W / 2, 820);

  ctx.font = `900 60px ${condensedFont}`;
  ctx.fillStyle = "#f5b800";
  ctx.fillText("NOTIZIE GIALLOROSSE", W / 2, 895);
  ctx.restore();

  // 6. 3 Pillole Stile "Stamp" / Streetwear Tag
  const tags = [
    "🐺 100% CUORE GIALLOROSSO",
    "⚡ 30 SECONDI PER SAPERE TUTTO",
    "🚫 ZERO PUBBLICITÀ INVASIVE",
  ];

  for (let i = 0; i < tags.length; i++) {
    const ty = 990 + i * 80;
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = "#f5b800";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 310, ty, 620, 58, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = "900 18px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "1px";
    ctx.fillText(tags[i], W / 2, ty + 29);
    ctx.restore();
  }

  // 7. Industrial / Bold CTA Block in basso
  const ctaY = 1380;
  const ctaH = 190;
  const ctaW = W - 140;
  const ctaX = 70;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 16;

  ctx.fillStyle = "#0c0204";
  ctx.strokeStyle = "#f5b800";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 22);
  ctx.fill();
  ctx.stroke();

  // Strisce d'allerta gialle/oro decorative sui lati
  ctx.fillStyle = "#f5b800";
  ctx.fillRect(ctaX, ctaY, 16, ctaH);
  ctx.fillRect(ctaX + ctaW - 16, ctaY, 16, ctaH);

  ctx.shadowColor = "transparent";
  ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#f5b800";
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText("IL TUO QUOTIDIANO ONLINE GRATUITO", W / 2, ctaY + 60);

  ctx.font = `900 62px ${condensedFont}`;
  ctx.fillStyle = "#ffffff";
  ctx.letterSpacing = "2px";
  ctx.fillText("WWW.ROMAFLASH.APP ➔", W / 2, ctaY + 135);

  ctx.restore();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const filePromise = new Promise<File | null>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], `romaflash-storia-outro-9-16.jpg`, {
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
