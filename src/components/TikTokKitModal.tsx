"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Copy, Check, Share2 } from "lucide-react";
import { getArticleImageUrl } from "@/components/ArticleImage";

export function TikTokIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
    </svg>
  );
}

interface TikTokKitModalProps {
  article: any | null;
  onClose: () => void;
  onMarkShared?: (articleId: string, shared: boolean) => void;
}

const SLIDE_W = 1080;
const SLIDE_H = 1350; // 4:5 aspect ratio (same as @romanews.eu TikTok photo mode)

const WOLF_LOGO_SVG_PATH =
  "M179.3 38.94C154.7 77.7 142.7 139.7 168.4 185.9l-16.3 9.2c-6.7-11.9-11.2-24.4-13.9-37.2c-34.5-6.3-69.42-7.5-104.98-2.1c34.07 10.1 52.77 23.7 76.68 46.7c-26.82 9.7-60.25 30.2-92.93 70.2c35.47-8.8 64.83-11.5 89.43-6.3c-36.94 22.5-64.06 56.1-88.34 114.1c35.9-17.2 64.89-18.8 102.94-18.8c-23.07 32.7-35.27 77.2-36.31 112.8c24.51-26 57.61-60.2 87.21-79c3 29.9 15 58.3 35.9 85.3c-.2-43.9 10.3-88.3 31.6-133.4c-18.8 9-32.4 18.1-49.9 29.3c6.2-27.9 12.4-55.8 18.7-83.7c-23.3 2.4-39 10-60.5 18.5c16.3-33.1 32.7-66.1 49.1-99.2l16.8 8.3l-28.4 57.4c18.4-4.4 28.7-4.1 45.7-1.3c-4.5 20.4-9 40.7-13.6 61c65.3-36.2 148.3-45.9 226.7-50c7.6-12.9 13.8-24.2 18.8-34.8l-6.3-24.4l-24.4 30.8l-7.8-27.5l-22.5 29.2l-7.5-26.1l-23.9 31.5l-7.7-28.2l-23.8 31.4l1.2-41.1l22.6-42.7l7.6 28.3l23.9-31.5l7.6 28.2l23.5-30l6.5 26.9l24.5-30.8l7.8 27.5l24.6-32c2.3-10.8 4.6-22.4 7.4-35.7c-55.5-3.7-106.3 4.8-154 9.8c-38-20.8-80.8-26.8-121.9-18.5c-13.6-29.69-27.2-59.38-40.9-89.06M325.5 158.3c-4.5 14.2-13 18.3-24.7 20.6c-16.1-4.4-28.3-15.5-34.4-30.2c20.4-3.8 42.4 3.4 59.1 9.6";

function getCondensedFontFamily(): string {
  if (typeof document !== "undefined") {
    const computed = getComputedStyle(document.documentElement);
    const bebas = computed.getPropertyValue("--font-bebas").trim();
    const oswald = computed.getPropertyValue("--font-oswald").trim();
    if (bebas) return `${bebas}, Impact, "Arial Narrow", sans-serif`;
    if (oswald) return `${oswald}, Impact, "Arial Narrow", sans-serif`;
  }
  return `"Bebas Neue", "Oswald", Impact, "Arial Narrow", sans-serif`;
}

function wrapText(
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

function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function toProxiedUrl(url: string): string {
  if (!url) return "/images/archive/roma-1.jpg";
  if (url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
}

/**
 * Draws the full-bleed background photo (1080x1350) with natural cover framing
 * and a right-side dark editorial gradient so the giant condensed text pops.
 */
function drawPhotoBackground(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  focusLeft = true
) {
  ctx.fillStyle = "#140407";
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  if (img && img.width > 0 && img.height > 0) {
    const scale = Math.max(SLIDE_W / img.width, SLIDE_H / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    // Slight horizontal bias so subject is visible on the left side while text sits on the right
    const offsetX = focusLeft
      ? Math.min(0, (SLIDE_W - drawW) * 0.35)
      : (SLIDE_W - drawW) * 0.5;
    const offsetY = (SLIDE_H - drawH) * 0.3;
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  }

  // Right-side dark gradient overlay (matches @romanews.eu readability shadow)
  const rightGrad = ctx.createLinearGradient(180, 0, SLIDE_W, 0);
  rightGrad.addColorStop(0, "rgba(0, 0, 0, 0.08)");
  rightGrad.addColorStop(0.32, "rgba(0, 0, 0, 0.42)");
  rightGrad.addColorStop(0.65, "rgba(0, 0, 0, 0.68)");
  rightGrad.addColorStop(1, "rgba(0, 0, 0, 0.82)");
  ctx.fillStyle = rightGrad;
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  // Subtle top & bottom vignette
  const vertGrad = ctx.createLinearGradient(0, 0, 0, SLIDE_H);
  vertGrad.addColorStop(0, "rgba(0, 0, 0, 0.28)");
  vertGrad.addColorStop(0.2, "rgba(0, 0, 0, 0)");
  vertGrad.addColorStop(0.78, "rgba(0, 0, 0, 0.12)");
  vertGrad.addColorStop(1, "rgba(0, 0, 0, 0.55)");
  ctx.fillStyle = vertGrad;
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  // Micro-jitter grain so every exported JPEG has a unique hash
  for (let i = 0; i < 250; i++) {
    const gx = Math.floor(Math.random() * SLIDE_W);
    const gy = Math.floor(Math.random() * SLIDE_H);
    ctx.fillStyle =
      i % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.012)";
    ctx.fillRect(gx, gy, 2, 2);
  }
}

/**
 * Draws the top-left circular logo badge in the exact position & style of @romanews.eu,
 * featuring the RomaFlash Wolf emblem and ROMAFLASH.APP label inside a crisp circular crest.
 */
function drawTopLeftCircularLogo(ctx: CanvasRenderingContext2D) {
  const cx = 98;
  const cy = 94;
  const r = 74;

  ctx.save();

  // Drop shadow behind circular badge
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;

  // Outer circle fill (deep Roma bordeaux so the gold WolfLogo stands out sharply)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#26050a";
  ctx.fill();

  // Reset shadow for crisp borders
  ctx.shadowColor = "transparent";

  // Outer red-orange ring + inner gold ring
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#f0b516";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(224, 45, 71, 0.85)";
  ctx.stroke();

  // Draw WolfLogo centered in upper portion of the circle
  const wolfSize = 84;
  ctx.save();
  ctx.translate(cx - wolfSize / 2, cy - 52);
  const scale = wolfSize / 512;
  ctx.scale(scale, scale);
  const wolfPath = new Path2D(WOLF_LOGO_SVG_PATH);
  ctx.fillStyle = "#f0b516";
  ctx.fill(wolfPath);
  ctx.restore();

  // "ROMAFLASH" text inside bottom of the circle
  ctx.font = "900 15px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("ROMAFLASH", cx, cy + 40);

  ctx.restore();
}

/**
 * Draws the bottom-left ">>> SCORRI A DESTRA" yellow chevrons + white text indicator on Slide 1.
 */
function drawSwipeRightIndicator(ctx: CanvasRenderingContext2D) {
  const startX = 76;
  const topY = 1175;
  const chevW = 66;
  const chevH = 118;
  const thickness = 44;
  const gap = 90;

  ctx.save();

  // 3 Yellow Chevrons (>>>)
  ctx.fillStyle = "#f5b800";
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 4;

  for (let i = 0; i < 3; i++) {
    const x = startX + i * gap;
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x + thickness, topY);
    ctx.lineTo(x + thickness + chevW, topY + chevH / 2);
    ctx.lineTo(x + thickness, topY + chevH);
    ctx.lineTo(x, topY + chevH);
    ctx.lineTo(x + chevW, topY + chevH / 2);
    ctx.closePath();
    ctx.fill();
  }

  // "SCORRI A DESTRA" centered over the chevrons
  const centerX = startX + (2 * gap + thickness + chevW) / 2;
  const centerY = topY + chevH / 2;
  ctx.font = "900 33px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 7;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
  ctx.strokeText("SCORRI A DESTRA", centerX, centerY);
  ctx.fillStyle = "#ffffff";
  ctx.fillText("SCORRI A DESTRA", centerX, centerY);

  ctx.restore();
}

/**
 * Draws the top-right yellow circle with the point number (1, 2, 3) like @romanews.eu.
 */
function drawTopRightNumberCircle(
  ctx: CanvasRenderingContext2D,
  pointNumber: number
) {
  const cx = 936;
  const cy = 128;
  const r = 106;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#f5b800";
  ctx.stroke();

  ctx.font = "900 84px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#f5b800";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(pointNumber), cx, cy + 4);
  ctx.restore();
}

/**
 * Fits uppercase text into the right-hand column using condensed poster typography,
 * automatically scaling font size so lines fill the vertical space cleanly.
 */
function fitRightColumnPosterLines(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number,
  maxHeight: number,
  maxFontSize = 148,
  minFontSize = 78
): { lines: string[]; fontSize: number; lineHeight: number } {
  const cleanUpper = rawText
    .replace(/['’‘]/g, "'")
    .replace(/[“”«»]/g, '"')
    .toUpperCase()
    .trim();

  const fontFamily = getCondensedFontFamily();

  for (let size = maxFontSize; size >= minFontSize; size -= 4) {
    ctx.font = `700 ${size}px ${fontFamily}`;
    const lines = wrapText(ctx, cleanUpper, maxWidth);
    const lineHeight = Math.round(size * 0.94);
    const totalH = lines.length * lineHeight;

    // Ensure no single word exceeds maxWidth and total height fits maxHeight
    const widestWord = cleanUpper
      .split(/\s+/)
      .reduce((max, w) => Math.max(max, ctx.measureText(w).width), 0);

    if (totalH <= maxHeight && widestWord <= maxWidth + 8 && lines.length <= 9) {
      return { lines, fontSize: size, lineHeight };
    }
  }

  const fallbackSize = minFontSize;
  ctx.font = `700 ${fallbackSize}px ${fontFamily}`;
  const lines = wrapText(ctx, cleanUpper, maxWidth).slice(0, 9);
  return {
    lines,
    fontSize: fallbackSize,
    lineHeight: Math.round(fallbackSize * 0.94),
  };
}

/**
 * Extracts 3 punchy, self-contained journalistic points (10-16 words each) from the article
 * for Slides 2, 3, and 4 (numbered 1, 2, 3).
 */
function extractThreeKeyPoints(article: any): [string, string, string] {
  const excerpt = (article?.ai_summary?.excerpt || "").trim();
  const content = (article?.ai_summary?.content || "").trim();

  const combined = `${excerpt} ${content}`
    .replace(/\s+/g, " ")
    .trim();

  // Split into sentences
  const rawSentences = combined
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[•\-–—\s]+/, "").trim())
    .filter((s) => s.length >= 25);

  const shortenToPunchyPoint = (sentence: string, maxWords = 14): string => {
    const cleaned = sentence
      .replace(/\([^)]*\)/g, "")
      .replace(/["«»“”]/g, "")
      .replace(/[.!?]+$/, "")
      .trim();

    // If sentence has clauses separated by ";" or ":", keep the strongest 1-2 clauses
    const words = cleaned.split(/\s+/);
    if (words.length <= maxWords) return cleaned;

    // Try cutting cleanly at a comma or colon between word 8 and maxWords
    const subClauses = cleaned.split(/[,;:–—]/);
    let acc = "";
    for (const clause of subClauses) {
      const candidate = acc ? `${acc}, ${clause.trim()}` : clause.trim();
      const wc = candidate.split(/\s+/).length;
      if (wc <= maxWords) {
        acc = candidate;
      } else {
        break;
      }
    }
    if (acc && acc.split(/\s+/).length >= 7) {
      return acc;
    }

    return words.slice(0, maxWords).join(" ").replace(/[,;:\s]+$/, "");
  };

  // Pick 3 distinct sentences spread across the article
  const uniqueSentences: string[] = [];
  for (const s of rawSentences) {
    const norm = s.toLowerCase().slice(0, 30);
    if (!uniqueSentences.some((u) => u.toLowerCase().slice(0, 30) === norm)) {
      uniqueSentences.push(s);
    }
  }

  const p1 = uniqueSentences[0]
    ? shortenToPunchyPoint(uniqueSentences[0], 14)
    : "Tutti i dettagli sulla situazione in casa giallorossa a Trigoria";
  const midIdx = Math.max(1, Math.floor(uniqueSentences.length / 2));
  const p2 = uniqueSentences[midIdx]
    ? shortenToPunchyPoint(uniqueSentences[midIdx], 14)
    : "La società e lo staff tecnico valutano le prossime mosse decisive";
  const lastIdx =
    uniqueSentences.length > 2 ? uniqueSentences.length - 1 : 2;
  const p3 =
    uniqueSentences[lastIdx] && lastIdx !== midIdx
      ? shortenToPunchyPoint(uniqueSentences[lastIdx], 14)
      : "Attesa per i prossimi impegni ufficiali della squadra giallorossa";

  return [p1, p2, p3];
}

function renderCoverSlide(
  article: any,
  bgImg: HTMLImageElement | null
): string {
  const canvas = document.createElement("canvas");
  canvas.width = SLIDE_W;
  canvas.height = SLIDE_H;
  const ctx = canvas.getContext("2d")!;

  drawPhotoBackground(ctx, bgImg, true);
  drawTopLeftCircularLogo(ctx);
  drawSwipeRightIndicator(ctx);

  const rightX = 465;
  const rightMaxW = 575;
  const areaTop = 65;
  const areaBottom = 1285;
  const maxH = areaBottom - areaTop;

  const title = article?.title || "Ultime notizie AS Roma";
  const { lines, fontSize, lineHeight } = fitRightColumnPosterLines(
    ctx,
    title,
    rightMaxW,
    maxH,
    144,
    82
  );

  const totalTextH = lines.length * lineHeight;
  let y = Math.max(areaTop, Math.round(areaTop + (maxH - totalTextH) / 2));

  // Split color between White (#ffffff) top half and Yellow Gold (#f5b800) bottom half
  const colonLineIdx = lines.findIndex((l) => l.includes(":"));
  const splitIdx =
    colonLineIdx >= 0 && colonLineIdx < lines.length - 1
      ? colonLineIdx + 1
      : Math.ceil(lines.length / 2);

  const fontFamily = getCondensedFontFamily();
  ctx.save();
  ctx.font = `700 ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.shadowColor = "rgba(0, 0, 0, 0.92)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 6;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillStyle = i < splitIdx ? "#ffffff" : "#f5b800";
    ctx.fillText(lines[i], rightX, y);
    y += lineHeight;
  }
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.94);
}

function renderPointSlide(
  pointNumber: number,
  pointText: string,
  bgImg: HTMLImageElement | null
): string {
  const canvas = document.createElement("canvas");
  canvas.width = SLIDE_W;
  canvas.height = SLIDE_H;
  const ctx = canvas.getContext("2d")!;

  drawPhotoBackground(ctx, bgImg, true);
  drawTopLeftCircularLogo(ctx);
  drawTopRightNumberCircle(ctx, pointNumber);

  const rightX = 465;
  const rightMaxW = 575;
  const areaTop = 265;
  const areaBottom = 1295;
  const maxH = areaBottom - areaTop;

  const { lines, fontSize, lineHeight } = fitRightColumnPosterLines(
    ctx,
    pointText,
    rightMaxW,
    maxH,
    138,
    78
  );

  const totalTextH = lines.length * lineHeight;
  let y = Math.max(areaTop, Math.round(areaTop + (maxH - totalTextH) / 2));

  const splitIdx = Math.ceil(lines.length / 2);
  const startWithYellow = pointNumber % 2 === 1;

  const fontFamily = getCondensedFontFamily();
  ctx.save();
  ctx.font = `700 ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.shadowColor = "rgba(0, 0, 0, 0.92)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 6;

  for (let i = 0; i < lines.length; i++) {
    const isFirstHalf = i < splitIdx;
    if (startWithYellow) {
      ctx.fillStyle = isFirstHalf ? "#f5b800" : "#ffffff";
    } else {
      ctx.fillStyle = isFirstHalf ? "#ffffff" : "#f5b800";
    }
    ctx.fillText(lines[i], rightX, y);
    y += lineHeight;
  }
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.94);
}

export default function TikTokKitModal({
  article,
  onClose,
  onMarkShared,
}: TikTokKitModalProps) {
  const [slides, setSlides] = useState<string[]>([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [generating, setGenerating] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!article) return;
    let cancelled = false;
    setGenerating(true);
    setActiveSlideIdx(0);
    setCopied(false);

    async function generateAllSlides() {
      try {
        if (typeof document !== "undefined" && (document as any).fonts) {
          const ff = getCondensedFontFamily();
          await (document as any).fonts.load(`700 100px ${ff}`);
          await (document as any).fonts.ready;
        }
      } catch {
        // continue
      }

      // Slide 1 uses the article's main photo; Slides 2, 3, 4 use 3 distinct archive photos
      const mainImgUrl = getArticleImageUrl(article) || "/images/archive/roma-1.jpg";
      const idStr = String(article.id || article.title || "");
      let hash = 0;
      for (let i = 0; i < idStr.length; i++) {
        hash = (hash * 31 + idStr.charCodeAt(i)) >>> 0;
      }

      const pickArchivePath = (offset: number) => {
        const idx = ((hash + offset * 3) % 10) + 1;
        return `/images/archive/roma-${idx}.jpg`;
      };

      const bgUrls = [
        toProxiedUrl(mainImgUrl),
        pickArchivePath(1),
        pickArchivePath(2),
        pickArchivePath(3),
      ];

      // Ensure Slide 2 doesn't accidentally repeat Slide 1 if Slide 1 was already an archive photo
      if (bgUrls[1] === mainImgUrl) {
        bgUrls[1] = pickArchivePath(4);
      }

      const loadedImages = await Promise.all(bgUrls.map((u) => loadImageElement(u)));
      if (!loadedImages[0]) {
        loadedImages[0] = await loadImageElement(pickArchivePath(0));
      }
      const [point1, point2, point3] = extractThreeKeyPoints(article);

      const s1 = renderCoverSlide(article, loadedImages[0]);
      const s2 = renderPointSlide(1, point1, loadedImages[1]);
      const s3 = renderPointSlide(2, point2, loadedImages[2]);
      const s4 = renderPointSlide(3, point3, loadedImages[3]);

      if (!cancelled) {
        setSlides([s1, s2, s3, s4]);
        setGenerating(false);
      }
    }

    generateAllSlides();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelled = true;
      document.body.style.overflow = prevOverflow;
    };
  }, [article]);

  if (!article || typeof document === "undefined") return null;

  const extraTags = (article.ai_summary?.dynamic_hashtags || "")
    .replace(/#ASRoma/gi, "")
    .replace(/#RomaFlash/gi, "")
    .replace(/#Romanisti/gi, "")
    .replace(/#CurvaSudRoma/gi, "")
    .replace(/#SerieA/gi, "")
    .replace(/#PerTe/gi, "")
    .trim();

  const hashtags = `#asroma #romaflash ${extraTags ? `${extraTags.toLowerCase()} ` : ""}#seriea #perte`;
  const cleanExcerpt = (article.ai_summary?.excerpt || article.title || "").trim();
  const tiktokCaption = `${article.title} 🟡🔴🐺\n${cleanExcerpt}\n\n${hashtags}`;

  const handleDownloadSingle = (dataUrl: string, index: number) => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `romaflash-tiktok-${index + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onMarkShared && article?.id) {
      onMarkShared(article.id, true);
    }
  };

  const handleDownloadAll = () => {
    slides.forEach((url, idx) => {
      setTimeout(() => {
        handleDownloadSingle(url, idx);
      }, idx * 280);
    });
  };

  const handleShareMobile = async () => {
    if (slides.length === 0) return;
    try {
      const files: File[] = [];
      for (let i = 0; i < slides.length; i++) {
        const res = await fetch(slides[i]);
        const blob = await res.blob();
        files.push(
          new File([blob], `romaflash-tiktok-${i + 1}.jpg`, {
            type: "image/jpeg",
          })
        );
      }

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: article.title,
          text: tiktokCaption,
        });
        if (onMarkShared && article?.id) {
          onMarkShared(article.id, true);
        }
      } else {
        handleDownloadAll();
      }
    } catch {
      // User cancelled share
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(tiktokCaption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white border border-border rounded-2xl max-w-3xl w-full p-4 md:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-black text-white">
              <TikTokIcon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm md:text-base font-black text-gray-900">
                Kit TikTok Photo Mode — 4 Slide (1080×1350 4:5)
              </h3>
              <p className="text-[11px] text-gray-500">
                Stile editoriale fotografico con Copertina + 3 Punti numerati
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Left: Slide Preview + Switcher */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="flex flex-wrap gap-1.5 mb-3 w-full justify-center">
              {["Copertina", "Punto 1", "Punto 2", "Punto 3"].map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveSlideIdx(idx)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeSlideIdx === idx
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {generating ? (
              <div className="w-[240px] aspect-[4/5] rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-500 font-semibold">
                Generazione 4 slide...
              </div>
            ) : (
              slides[activeSlideIdx] && (
                <img
                  src={slides[activeSlideIdx]}
                  alt={`Slide ${activeSlideIdx + 1}`}
                  className="w-[240px] md:w-[270px] aspect-[4/5] object-cover rounded-2xl shadow-lg border border-gray-200"
                />
              )
            )}
          </div>

          {/* Right: Download Buttons & Copyable Caption */}
          <div className="md:col-span-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={generating}
              onClick={handleDownloadAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Scarica tutte le 4 Slide (JPG)
            </button>

            <div className="grid grid-cols-2 gap-2">
              {["Slide 1 (Cover)", "Slide 2 (Punto 1)", "Slide 3 (Punto 2)", "Slide 4 (Punto 3)"].map(
                (label, idx) => (
                  <button
                    key={label}
                    type="button"
                    disabled={generating || !slides[idx]}
                    onClick={() => handleDownloadSingle(slides[idx], idx)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gray-100 text-gray-800 text-[11px] font-bold hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    {label}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              disabled={generating}
              onClick={handleShareMobile}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5" />
              Invia / Salva tutte su Smartphone
            </button>

            {/* Caption Box */}
            <div className="bg-gray-50 border border-border rounded-xl p-3 mt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Didascalia + Hashtag per TikTok
                </span>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copiato!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copia Testo
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {tiktokCaption}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
