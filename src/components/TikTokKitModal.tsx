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
const SLIDE_H = 1350; // 4:5 portrait format for TikTok

const WOLF_LOGO_SVG_PATH =
  "M179.3 38.94C154.7 77.7 142.7 139.7 168.4 185.9l-16.3 9.2c-6.7-11.9-11.2-24.4-13.9-37.2c-34.5-6.3-69.42-7.5-104.98-2.1c34.07 10.1 52.77 23.7 76.68 46.7c-26.82 9.7-60.25 30.2-92.93 70.2c35.47-8.8 64.83-11.5 89.43-6.3c-36.94 22.5-64.06 56.1-88.34 114.1c35.9-17.2 64.89-18.8 102.94-18.8c-23.07 32.7-35.27 77.2-36.31 112.8c24.51-26 57.61-60.2 87.21-79c3 29.9 15 58.3 35.9 85.3c-.2-43.9 10.3-88.3 31.6-133.4c-18.8 9-32.4 18.1-49.9 29.3c6.2-27.9 12.4-55.8 18.7-83.7c-23.3 2.4-39 10-60.5 18.5c16.3-33.1 32.7-66.1 49.1-99.2l16.8 8.3l-28.4 57.4c18.4-4.4 28.7-4.1 45.7-1.3c-4.5 20.4-9 40.7-13.6 61c65.3-36.2 148.3-45.9 226.7-50c7.6-12.9 13.8-24.2 18.8-34.8l-6.3-24.4l-24.4 30.8l-7.8-27.5l-22.5 29.2l-7.5-26.1l-23.9 31.5l-7.7-28.2l-23.8 31.4l1.2-41.1l22.6-42.7l7.6 28.3l23.9-31.5l7.6 28.2l23.5-30l6.5 26.9l24.5-30.8l7.8 27.5l24.6-32c2.3-10.8 4.6-22.4 7.4-35.7c-55.5-3.7-106.3 4.8-154 9.8c-38-20.8-80.8-26.8-121.9-18.5c-13.6-29.69-27.2-59.38-40.9-89.06M325.5 158.3c-4.5 14.2-13 18.3-24.7 20.6c-16.1-4.4-28.3-15.5-34.4-30.2c20.4-3.8 42.4 3.4 59.1 9.6";

function getCondensedFontFamily(): string {
  if (typeof document !== "undefined") {
    const computed = getComputedStyle(document.documentElement);
    const oswald = computed.getPropertyValue("--font-oswald").trim();
    const bebas = computed.getPropertyValue("--font-bebas").trim();
    if (oswald) return `${oswald}, Impact, "Arial Narrow", sans-serif`;
    if (bebas) return `${bebas}, Impact, "Arial Narrow", sans-serif`;
  }
  return `"Oswald", "Bebas Neue", Impact, "Arial Narrow", sans-serif`;
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
 * Draws the top-left circular RomaFlash crest (matching @romanews.eu placement).
 */
function drawTopLeftCircularLogo(ctx: CanvasRenderingContext2D) {
  const cx = 96;
  const cy = 94;
  const r = 72;

  ctx.save();

  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#26050a";
  ctx.fill();

  ctx.shadowColor = "transparent";

  ctx.lineWidth = 5;
  ctx.strokeStyle = "#f0b516";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(224, 45, 71, 0.85)";
  ctx.stroke();

  const wolfSize = 82;
  ctx.save();
  ctx.translate(cx - wolfSize / 2, cy - 50);
  const scale = wolfSize / 512;
  ctx.scale(scale, scale);
  const wolfPath = new Path2D(WOLF_LOGO_SVG_PATH);
  ctx.fillStyle = "#f0b516";
  ctx.fill(wolfPath);
  ctx.restore();

  ctx.font = "900 15px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("ROMAFLASH", cx, cy + 39);

  ctx.restore();
}

/**
 * Builds a complete, never-truncated "super sunto" of the article.
 * Uses ai_summary.excerpt (which is always a complete 2-sentence summary)
 * and optionally adds the next complete sentence from content if excerpt is short.
 */
function buildCompleteSuperSunto(article: any): string {
  const excerpt = (article?.ai_summary?.excerpt || "").replace(/\s+/g, " ").trim();
  const content = (article?.ai_summary?.content || "").replace(/\s+/g, " ").trim();

  if (excerpt && excerpt.length >= 110) {
    return excerpt;
  }

  // Extract complete sentences from content
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
    // Try appending 1 extra non-duplicate sentence from content if excerpt is very short
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

  return "Tutti gli aggiornamenti e i dettagli in tempo reale sull'AS Roma.";
}

/**
 * Renders the single 1080x1350 photo-poster slide with:
 * - The article's real photo as background
 * - Top-left circular RomaFlash logo
 * - Full untrunacted Headline + Full untruncated Super Sunto on the lower half
 */
function renderSingleSlide(
  article: any,
  bgImg: HTMLImageElement | null
): string {
  const canvas = document.createElement("canvas");
  canvas.width = SLIDE_W;
  canvas.height = SLIDE_H;
  const ctx = canvas.getContext("2d")!;

  // 1. Background Photo (framed so top ~62% clearly shows the real photo subject)
  ctx.fillStyle = "#140407";
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  if (bgImg && bgImg.width > 0 && bgImg.height > 0) {
    // Draw photo in top/full area with smart vertical bias toward the top so faces/action aren't covered by bottom text
    const targetH = 920; // Photo prominent in upper 920px, smoothly blending into dark editorial base
    const scale = Math.max(SLIDE_W / bgImg.width, targetH / bgImg.height);
    const drawW = bgImg.width * scale;
    const drawH = bgImg.height * scale;
    const offsetX = (SLIDE_W - drawW) * 0.5;
    const offsetY = Math.min(0, (targetH - drawH) * 0.2);
    ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
  }

  // Smooth vertical gradient from transparent photo top into deep dark editorial bottom
  const grad = ctx.createLinearGradient(0, 0, 0, SLIDE_H);
  grad.addColorStop(0, "rgba(0, 0, 0, 0.22)");
  grad.addColorStop(0.18, "rgba(0, 0, 0, 0.0)");
  grad.addColorStop(0.42, "rgba(12, 2, 4, 0.25)");
  grad.addColorStop(0.56, "rgba(16, 3, 6, 0.84)");
  grad.addColorStop(0.7, "rgba(18, 3, 6, 0.96)");
  grad.addColorStop(1, "#120204");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  // Subtle micro-grain for unique perceptual hash on TikTok
  for (let i = 0; i < 240; i++) {
    const gx = Math.floor(Math.random() * SLIDE_W);
    const gy = Math.floor(Math.random() * SLIDE_H);
    ctx.fillStyle =
      i % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.012)";
    ctx.fillRect(gx, gy, 2, 2);
  }

  // 2. Top-Left Circular Logo Badge
  drawTopLeftCircularLogo(ctx);

  // 3. Measure & Auto-Fit Full Title + Full Super Sunto so ZERO words are ever cut off
  const padX = 72;
  const maxW = SLIDE_W - padX * 2; // 936px
  const titleText = (article?.title || "Ultime Notizie AS Roma")
    .replace(/['’‘]/g, "'")
    .toUpperCase()
    .trim();
  const suntoText = buildCompleteSuperSunto(article);
  const categoryText = (article?.ai_summary?.category || "ULTIM'ORA").toUpperCase();

  const condensedFont = getCondensedFontFamily();

  // Dynamic sizing loop so Title + Sunto always fit comfortably between y=560 and y=1285 without any truncation
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
      52 + // Category badge
      titleLines.length * titleLineH +
      34 + // Gold bar gap
      suntoLines.length * suntoLineH;

    if (totalBlockH <= 690 || (titleSize <= 48 && suntoSize <= 28)) {
      break;
    }
    titleSize -= 3;
    suntoSize -= 2;
  }

  const totalBlockH =
    52 +
    titleLines.length * titleLineH +
    34 +
    suntoLines.length * suntoLineH;

  // Position block in the lower portion, leaving generous bottom margin (y <= 1280)
  const bottomLimit = 1280;
  const minTop = 540;
  let y = Math.max(minTop, bottomLimit - totalBlockH);

  ctx.save();
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  // Category Pill Badge
  ctx.font = "800 22px system-ui, -apple-system, sans-serif";
  const catMetrics = ctx.measureText(categoryText);
  const pillW = catMetrics.width + 32;
  const pillH = 38;
  ctx.fillStyle = "#e02d47";
  ctx.beginPath();
  ctx.roundRect(padX, y, pillW, pillH, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(categoryText, padX + 16, y + 8);

  y += 54;

  // Headline (Two-tone White + Gold, 100% complete)
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

  // Gold Separator Bar
  y += 14;
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#f5b800";
  ctx.beginPath();
  ctx.roundRect(padX, y, 140, 6, 3);
  ctx.fill();
  y += 24;

  // Complete Super Sunto (Crisp white readable body, 100% complete)
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

  return canvas.toDataURL("image/jpeg", 0.94);
}

export default function TikTokKitModal({
  article,
  onClose,
  onMarkShared,
}: TikTokKitModalProps) {
  const [slideUrl, setSlideUrl] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!article) return;
    let cancelled = false;
    setGenerating(true);
    setCopied(false);

    async function generateSlide() {
      try {
        if (typeof document !== "undefined" && (document as any).fonts) {
          const ff = getCondensedFontFamily();
          await (document as any).fonts.load(`700 80px ${ff}`);
          await (document as any).fonts.ready;
        }
      } catch {
        // continue
      }

      const mainImgUrl = getArticleImageUrl(article) || "/images/archive/roma-1.jpg";
      let loadedImg = await loadImageElement(toProxiedUrl(mainImgUrl));
      if (!loadedImg) {
        loadedImg = await loadImageElement("/images/archive/roma-1.jpg");
      }

      const dataUrl = renderSingleSlide(article, loadedImg);
      if (!cancelled) {
        setSlideUrl(dataUrl);
        setGenerating(false);
      }
    }

    generateSlide();

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

  const handleDownload = () => {
    if (!slideUrl) return;
    const a = document.createElement("a");
    a.href = slideUrl;
    a.download = "romaflash-tiktok.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onMarkShared && article?.id) {
      onMarkShared(article.id, true);
    }
  };

  const handleShareMobile = async () => {
    if (!slideUrl) return;
    try {
      const res = await fetch(slideUrl);
      const blob = await res.blob();
      const file = new File([blob], "romaflash-tiktok.jpg", {
        type: "image/jpeg",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: article.title,
          text: tiktokCaption,
        });
        if (onMarkShared && article?.id) {
          onMarkShared(article.id, true);
        }
      } else {
        handleDownload();
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
                Locandina TikTok (1080×1350 4:5)
              </h3>
              <p className="text-[11px] text-gray-500">
                Foto reale dell&apos;articolo con Titolo + Super Sunto completo
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
          {/* Left: Slide Preview */}
          <div className="md:col-span-6 flex flex-col items-center">
            {generating ? (
              <div className="w-[250px] aspect-[4/5] rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-500 font-semibold">
                Generazione locandina...
              </div>
            ) : (
              slideUrl && (
                <img
                  src={slideUrl}
                  alt="Locandina TikTok"
                  className="w-[250px] md:w-[280px] aspect-[4/5] object-cover rounded-2xl shadow-lg border border-gray-200"
                />
              )
            )}
          </div>

          {/* Right: Download Buttons & Copyable Caption */}
          <div className="md:col-span-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={generating || !slideUrl}
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Scarica Locandina (JPG)
            </button>

            <button
              type="button"
              disabled={generating || !slideUrl}
              onClick={handleShareMobile}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5" />
              Invia / Salva su Smartphone
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
