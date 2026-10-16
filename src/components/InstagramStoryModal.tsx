"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Download, Copy, Check, Share2, Sparkles, Film, Image as ImageIcon } from "lucide-react";
import { getArticleImageUrl } from "@/components/ArticleImage";
import { getArticleUrl } from "@/lib/slug";

export function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface InstagramStoryModalProps {
  article: any | null;
  onClose: () => void;
}

export type InstagramFormat = "story" | "reel";

const STORY_W = 1080;
const STORY_H = 1920; // 9:16 portrait format for Instagram Stories and Reels

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

function toProxiedUrl(url: string | null | undefined): string {
  if (!url) return "/images/archive/roma-1.jpg";
  if (url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
}

/**
 * Disegna il logo tondo ufficiale di RomaFlash (posizionato a sinistra).
 */
function drawCircularLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 8;

  // Cerchio di base scuro
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#26050a";
  ctx.fill();

  ctx.shadowColor = "transparent";

  // Anello esterno oro
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#f0b516";
  ctx.stroke();

  // Anello interno carminio
  ctx.beginPath();
  ctx.arc(cx, cy, r - 7, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
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
 * Estrae un virgolettato o un highlight significativo dal contenuto dell'articolo.
 */
function extractHighlight(article: any): { quote: string; author: string } | null {
  const content = article?.ai_summary?.content || "";
  const lines = content.split("\n").map((l: string) => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (line.startsWith(">")) {
      const clean = line.replace(/^>\s*/, "");
      const match = clean.match(/^(.*?)\s+[—–-]\s+([^—–-]+)$/);
      if (match) {
        return {
          quote: match[1].replace(/^["“](.*)["”]$/, "$1").trim(),
          author: match[2].trim(),
        };
      }
      return {
        quote: clean.replace(/^["“](.*)["”]$/, "$1").trim(),
        author: "",
      };
    }
    if (/^["“].+[”"]\s*[—–-]\s*.+$/.test(line)) {
      const match = line.match(/^(.*?)\s+[—–-]\s+([^—–-]+)$/);
      if (match) {
        return {
          quote: match[1].replace(/^["“](.*)["”]$/, "$1").trim(),
          author: match[2].trim(),
        };
      }
    }
  }

  // Se non c'è un virgolettato esplicito, usa l'excerpt breve se presente
  const excerpt = (article?.ai_summary?.excerpt || "").trim();
  if (excerpt && excerpt.length >= 25 && excerpt.length <= 160) {
    return { quote: excerpt, author: "" };
  }

  return null;
}

/**
 * Genera la didascalia ottimizzata per i Reels di Instagram:
 * - Titolo dell'articolo
 * - Estratto riassuntivo
 * - Domanda/Call To Action per spingere i commenti
 * - Riferimento al sito
 * - 3-4 hashtag caldi mirati (#ASRoma #RomaFlash ...)
 */
export function buildReelCaption(article: any): string {
  const title = (article?.title || "").trim();
  const excerpt = (article?.ai_summary?.excerpt || "").trim();
  const dynamicTags = (article?.ai_summary?.dynamic_hashtags || "")
    .split(/\s+/)
    .filter((t: string) => t.startsWith("#"))
    .slice(0, 2)
    .join(" ");

  let cta = "Cosa ne pensi? Dì la tua nei commenti! 👇🐺";
  const cat = article?.ai_summary?.category;
  if (cat === "Dichiarazioni") {
    cta = "Sei d'accordo con queste parole? Scrivilo nei commenti! 👇🐺";
  } else if (cat === "Probabili Formazioni") {
    cta = "Chi faresti giocare titolare sabato? Scrivilo qui sotto! 👇🐺";
  } else if (cat === "Calciomercato") {
    cta = "Operazione giusta per la Roma? Commenta con la tua opinione! 👇🐺";
  }

  const tags = `#ASRoma #RomaFlash ${dynamicTags || "#SerieA"}`.trim();
  const articleUrl = getArticleUrl(article);

  return `${title}\n\n${excerpt ? excerpt + "\n\n" : ""}${cta}\n\n🔗 Leggi l'articolo completo su: ${articleUrl}\n\n${tags}`;
}

/**
 * Disegna la grafica 9:16 (1080x1920) per Storia o Reel.
 * - In "story": include lo sticker adesivo "Tocca per l'articolo".
 * - In "reel": layout 100% pulito ed editoriale senza sticker, solo logo a sinistra e titolo/citazione.
 */
function renderStoryCanvas(
  article: any,
  bgImg: HTMLImageElement | null,
  format: InstagramFormat
): { dataUrl: string; filePromise: Promise<File | null> } {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext("2d")!;

  // 1. Sfondo base scuro
  ctx.fillStyle = "#0c0204";
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // 2. Foto Hero (nella metà superiore 56%)
  if (bgImg && bgImg.width > 0 && bgImg.height > 0) {
    const targetH = 1140; // Copre i primi 1140px prima di sfumare nel buio
    const scale = Math.max(STORY_W / bgImg.width, targetH / bgImg.height);
    const drawW = bgImg.width * scale;
    const drawH = bgImg.height * scale;
    const offsetX = (STORY_W - drawW) * 0.5;
    const offsetY = Math.min(0, (targetH - drawH) * 0.15);
    ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
  }

  // 3. Gradiente cinematografico a più livelli per leggibilità perfetta
  const grad = ctx.createLinearGradient(0, 0, 0, STORY_H);
  grad.addColorStop(0, "rgba(0, 0, 0, 0.5)");
  grad.addColorStop(0.18, "rgba(0, 0, 0, 0.12)");
  grad.addColorStop(0.42, "rgba(12, 2, 4, 0.42)");
  grad.addColorStop(0.56, "rgba(14, 2, 5, 0.85)");
  grad.addColorStop(0.68, "rgba(15, 2, 4, 0.96)");
  grad.addColorStop(1, "#0a0103");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Bagliore radiale Giallorosso in fondo
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

  // 4. Logo Tondo Ufficiale sulla SINISTRA (richiesta utente)
  const padX = 84;
  const logoR = 76;
  const logoCx = padX + logoR;
  const logoCy = 175;
  drawCircularLogo(ctx, logoCx, logoCy, logoR);

  // 5. Sezione Inferiore: Titolo + Box Citazione
  const maxW = STORY_W - padX * 2; // 912px

  const titleRaw = (article?.title || "Ultime Notizie AS Roma")
    .replace(/['’‘]/g, "'")
    .toUpperCase();

  const fontFam = getCondensedFontFamily();

  // Calcolo dinamico dimensione font titolo
  let titleFontSize = 66;
  ctx.font = `900 ${titleFontSize}px ${fontFam}`;
  let titleLines = wrapText(ctx, titleRaw, maxW);

  if (titleLines.length > 4) {
    titleFontSize = 54;
    ctx.font = `900 ${titleFontSize}px ${fontFam}`;
    titleLines = wrapText(ctx, titleRaw, maxW);
  }

  const highlight = extractHighlight(article);

  const lineHeight = Math.round(titleFontSize * 1.22);
  const titleHeight = titleLines.length * lineHeight;

  // Box citazione eventuale
  let quoteLines: string[] = [];
  let quoteBoxH = 0;
  if (highlight?.quote) {
    ctx.font = "italic 32px Georgia, serif";
    const quoteMaxW = maxW - 48;
    quoteLines = wrapText(ctx, `"${highlight.quote}"`, quoteMaxW);
    quoteBoxH = quoteLines.length * 44 + (highlight.author ? 44 : 28);
  }

  // Posizionamento differenziato tra Storia (con sticker) e Reel (100% pulito)
  const isReel = format === "reel";
  const stickerH = 80;
  const stickerY = 1680;
  const footerY = isReel ? 1760 : 1810;

  let currentY: number;

  if (isReel) {
    // Layout Reel: nessun sticker, centratura armonica nella parte inferiore
    currentY = highlight?.quote
      ? footerY - 90 - quoteBoxH - 36 - titleHeight
      : footerY - 130 - titleHeight;
  } else {
    // Layout Storia: posizionato sopra lo sticker link
    currentY = highlight?.quote
      ? stickerY - 40 - quoteBoxH - 32 - titleHeight
      : stickerY - 60 - titleHeight;
  }

  // Limite superiore di sicurezza
  if (currentY < 1040) {
    currentY = 1040;
  }

  // Disegna Titolo
  ctx.save();
  ctx.font = `900 ${titleFontSize}px ${fontFam}`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (const line of titleLines) {
    ctx.fillText(line, padX, currentY);
    currentY += lineHeight;
  }
  ctx.restore();

  // Disegna eventuale Box Citazione / Highlight (pulito, senza badge)
  if (highlight?.quote && quoteLines.length > 0) {
    currentY += 24;
    const boxX = padX;
    const boxY = currentY;
    const boxW = maxW;

    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, quoteBoxH, 16);
    ctx.fill();

    // Bordo dorato a sinistra
    ctx.fillStyle = "#f0b516";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, 8, quoteBoxH, [16, 0, 0, 16]);
    ctx.fill();

    // Testo citazione
    ctx.font = "italic 30px Georgia, serif";
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    let qY = boxY + 18;
    for (const qLine of quoteLines) {
      ctx.fillText(qLine, boxX + 28, qY);
      qY += 40;
    }

    // Autore
    if (highlight.author) {
      ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#f0b516";
      ctx.textAlign = "right";
      ctx.fillText(`— ${highlight.author.toUpperCase()}`, boxX + boxW - 24, qY + 4);
    }

    ctx.restore();
  }

  // 6. Sticker Link Visual Mock: SOLO PER IL FORMATO STORIA (in Reel NON si disegna)
  if (!isReel) {
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

    // Icona catena link rossa
    ctx.fillStyle = "#8e1b23";
    ctx.beginPath();
    ctx.arc(stX + 46, stY + stickerH / 2, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🔗", stX + 46, stY + stickerH / 2);

    // Testo Sticker
    ctx.font = "900 24px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("TOCCA PER L'ARTICOLO", stX + 80, stY + stickerH / 2 - 2);

    ctx.font = "600 20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("•  romaflash.app", stX + 400, stY + stickerH / 2 - 2);

    ctx.restore();
  }

  // 7. Footer @romaflash 🐺
  ctx.save();
  ctx.font = isReel
    ? "bold 24px system-ui, -apple-system, sans-serif"
    : "bold 22px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = isReel ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.45)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "2px";
  ctx.fillText(isReel ? "ROMAFLASH • @ROMAFLASH 🐺" : "@ROMAFLASH 🐺", STORY_W / 2, footerY);
  ctx.restore();

  const dataUrl = canvas.toDataURL("image/png");
  const filePromise = new Promise<File | null>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      const prefix = isReel ? "romaflash-reel" : "romaflash-story";
      const file = new File(
        [blob],
        `${prefix}-${article?.id ? String(article.id).slice(0, 8) : "news"}.png`,
        { type: "image/png" }
      );
      resolve(file);
    }, "image/png");
  });

  return { dataUrl, filePromise };
}

export default function InstagramStoryModal({
  article,
  onClose,
}: InstagramStoryModalProps) {
  const [format, setFormat] = useState<InstagramFormat>("story");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [sharedSuccess, setSharedSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }
  }, []);

  useEffect(() => {
    if (!article) return;
    setLoading(true);

    let isMounted = true;
    const rawImgUrl = getArticleImageUrl(article);
    const proxiedImgUrl = toProxiedUrl(rawImgUrl);

    loadImageElement(proxiedImgUrl).then((bgImg) => {
      if (!isMounted) return;
      try {
        const { dataUrl, filePromise } = renderStoryCanvas(article, bgImg, format);
        setDataUrl(dataUrl);
        filePromise.then((file: File | null) => {
          if (isMounted && file) {
            setStoryFile(file);
          }
        });
      } catch (err) {
        console.error("Errore generazione grafica Instagram:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [article, format]);

  if (!article) return null;

  const articleUrl = getArticleUrl(article);
  const isReel = format === "reel";
  const reelCaption = useMemo(() => buildReelCaption(article), [article]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(reelCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    const prefix = isReel ? "romaflash-reel" : "romaflash-story";
    a.download = `${prefix}-${article.id.slice(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    // 1. Copia preventiva istantanea negli appunti senza await bloccanti:
    // in modalità Reel copia la didascalia completa con hashtag; in modalità Storia copia il link
    const textToCopy = isReel ? reelCaption : articleUrl;
    try {
      navigator.clipboard?.writeText(textToCopy);
      if (isReel) {
        setCopiedCaption(true);
        setTimeout(() => setCopiedCaption(false), 4000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 4000);
      }
    } catch {
      // ignore
    }

    // 2. Chiamata sincrona a navigator.share: mantiene il gesto utente valido su iOS Safari e Android Chrome!
    if (
      storyFile &&
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [storyFile] })
    ) {
      try {
        await navigator.share({
          files: [storyFile],
          title: article.title,
        });
        setSharedSuccess(true);
        setTimeout(() => setSharedSuccess(false), 4000);
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.warn("navigator.share non completato:", err);
      }
    }

    // 3. Fallback pulito: scarica direttamente il file PNG senza redirect esterni
    handleDownload();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm">
              <InstagramIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Grafica Instagram RomaFlash</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  9:16 HD
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Seleziona il formato per Storia o Reel ed esporta in 1 click
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Modal */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Anteprima Telefono (Sinistra) */}
          <div className="md:col-span-5 flex flex-col items-center gap-3">
            
            {/* Switch Formato: Storia vs Reel */}
            <div className="w-full max-w-[260px] flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setFormat("story")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  format === "story"
                    ? "bg-rose-900 text-amber-300 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Storia (Link)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("reel")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  format === "reel"
                    ? "bg-gradient-to-r from-purple-800 to-pink-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Reel (Clean)</span>
              </button>
            </div>

            {/* Frame Telefono 9:16 */}
            <div className="relative w-full max-w-[260px] aspect-[9/16] rounded-[28px] overflow-hidden bg-black border-4 border-slate-700 shadow-2xl">
              {loading || !dataUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Generazione HD...</span>
                </div>
              ) : (
                <img
                  src={dataUrl}
                  alt="Anteprima"
                  className="w-full h-full object-cover select-none"
                />
              )}
            </div>

            <span className="text-[10px] text-slate-400 font-medium">
              {isReel ? "🎬 Modalità Reel: 100% pulita senza sticker" : "📱 Modalità Storia: include sticker link"}
            </span>
          </div>

          {/* Istruzioni e Azioni (Destra) */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Box Dinamico: Didascalia per Reel OPPURE Link per Storia */}
            {isReel ? (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    Didascalia &amp; Hashtag (già pronti per il Reel):
                  </span>
                  <span className="text-[10px] text-pink-400 font-mono">
                    {copiedCaption ? "Copiata!" : "Pronta da incollare"}
                  </span>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={reelCaption}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded-lg p-2.5 resize-none focus:outline-none font-sans leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    copiedCaption
                      ? "bg-emerald-600 text-white"
                      : "bg-gradient-to-r from-purple-900 to-pink-900 hover:opacity-95 text-pink-200 border border-purple-500/40"
                  }`}
                >
                  {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCaption ? "Didascalia Copiata negli Appunti!" : "Copia Didascalia + Hashtag"}</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Link Articolo (per Sticker Storia):
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {copiedLink ? "Copiato!" : "Da incollare"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={articleUrl}
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      copiedLink
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    }`}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? "Copiato" : "Copia"}
                  </button>
                </div>
              </div>
            )}

            {/* Guida Differenziata */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{isReel ? "🎬" : "📱"}</span> Come pubblicare {isReel ? "il Reel" : "la Storia"}:
              </div>
              {isReel ? (
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11.5px] leading-relaxed">
                  <li>
                    Salva l'immagine e tocca <strong className="text-white">"Apri App Instagram"</strong>.
                  </li>
                  <li>
                    Crea un <strong className="text-pink-400">Reel</strong> usando questa foto per 5-7 secondi e aggiungi un audio in sottofondo.
                  </li>
                  <li>
                    Nella didascalia invita a commentare o a vedere la Storia per l'articolo completo!
                  </li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11.5px] leading-relaxed">
                  <li>
                    Tocca <strong className="text-white">"Condividi su Instagram"</strong> e scegli <strong>Instagram &gt; Storie</strong> (link copiato in automatico!).
                  </li>
                  <li>
                    Su Instagram tocca l'icona degli sticker e seleziona <strong className="text-amber-400">Link</strong>.
                  </li>
                  <li>
                    Fai <strong className="text-white">Incolla</strong> e pubblica la tua storia!
                  </li>
                </ol>
              )}
            </div>

            {/* Pulsanti Azione Principali */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              
              {/* Tasto 1: Scarica / Condividi */}
              <button
                type="button"
                onClick={handleShare}
                disabled={loading || !dataUrl}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:opacity-95 active:scale-95 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>{isMobile ? "Condividi Grafica (Mobile)" : "Scarica Grafica HD (9:16)"}</span>
              </button>

              {/* Tasto 2: Copia Testo Contestuale */}
              {isReel ? (
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs border shadow-sm transition-all cursor-pointer active:scale-95 ${
                    copiedCaption
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  }`}
                >
                  {copiedCaption ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-pink-400" />}
                  <span>{copiedCaption ? "Didascalia Copiata!" : "Copia Didascalia + Tag"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs border shadow-sm transition-all cursor-pointer active:scale-95 ${
                    copiedLink
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  <span>{copiedLink ? "Link Copiato!" : "Copia Link Articolo"}</span>
                </button>
              )}

            </div>

            {/* Pulsante Download Diretto (sempre accessibile) */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !dataUrl}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-300 font-semibold text-xs border border-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Scarica file PNG 1080×1920 ({isReel ? "Reel Clean" : "Storia con Link"})</span>
            </button>

            {sharedSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Grafica inviata a Instagram!</span>
              </div>
            )}

            {copiedCaption && !sharedSuccess && (
              <div className="p-2.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Didascalia e hashtag copiati! Fai &quot;Incolla&quot; nel campo testo del Reel.</span>
              </div>
            )}

            {copiedLink && !sharedSuccess && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Link copiato negli appunti! Pronto per lo sticker della Storia.</span>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}
