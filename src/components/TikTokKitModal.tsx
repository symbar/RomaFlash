"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Copy, Check, Share2 } from "lucide-react";

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = (text || "").split(/\s+/);
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

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const WOLF_LOGO_SVG_PATH =
  "M179.3 38.94C154.7 77.7 142.7 139.7 168.4 185.9l-16.3 9.2c-6.7-11.9-11.2-24.4-13.9-37.2c-34.5-6.3-69.42-7.5-104.98-2.1c34.07 10.1 52.77 23.7 76.68 46.7c-26.82 9.7-60.25 30.2-92.93 70.2c35.47-8.8 64.83-11.5 89.43-6.3c-36.94 22.5-64.06 56.1-88.34 114.1c35.9-17.2 64.89-18.8 102.94-18.8c-23.07 32.7-35.27 77.2-36.31 112.8c24.51-26 57.61-60.2 87.21-79c3 29.9 15 58.3 35.9 85.3c-.2-43.9 10.3-88.3 31.6-133.4c-18.8 9-32.4 18.1-49.9 29.3c6.2-27.9 12.4-55.8 18.7-83.7c-23.3 2.4-39 10-60.5 18.5c16.3-33.1 32.7-66.1 49.1-99.2l16.8 8.3l-28.4 57.4c18.4-4.4 28.7-4.1 45.7-1.3c-4.5 20.4-9 40.7-13.6 61c65.3-36.2 148.3-45.9 226.7-50c7.6-12.9 13.8-24.2 18.8-34.8l-6.3-24.4l-24.4 30.8l-7.8-27.5l-22.5 29.2l-7.5-26.1l-23.9 31.5l-7.7-28.2l-23.8 31.4l1.2-41.1l22.6-42.7l7.6 28.3l23.9-31.5l7.6 28.2l23.5-30l6.5 26.9l24.5-30.8l7.8 27.5l24.6-32c2.3-10.8 4.6-22.4 7.4-35.7c-55.5-3.7-106.3 4.8-154 9.8c-38-20.8-80.8-26.8-121.9-18.5c-13.6-29.69-27.2-59.38-40.9-89.06M325.5 158.3c-4.5 14.2-13 18.3-24.7 20.6c-16.1-4.4-28.3-15.5-34.4-30.2c20.4-3.8 42.4 3.4 59.1 9.6";

function drawUniformBackground(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, "#190407");
  grad.addColorStop(0.28, "#26060b");
  grad.addColorStop(0.55, "#3a0a11");
  grad.addColorStop(0.8, "#26060b");
  grad.addColorStop(1, "#120204");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  const radGrad = ctx.createRadialGradient(500, 900, 40, 500, 900, 560);
  radGrad.addColorStop(0, "rgba(142, 31, 47, 0.42)");
  radGrad.addColorStop(0.6, "rgba(240, 181, 22, 0.05)");
  radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, 1080, 1920);
}

const HEADER_Y = 310;
const HEADER_BOTTOM_Y = HEADER_Y + 124; // 434px

function drawCleanBrandHeader(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number
) {
  const y = HEADER_Y;

  // Exact WolfLogo from GlobalHeader (viewBox 0 0 512 512, fill #f0b516)
  ctx.save();
  ctx.translate(x, y);
  const scale = 88 / 512;
  ctx.scale(scale, scale);
  const wolfPath = new Path2D(WOLF_LOGO_SVG_PATH);
  ctx.fillStyle = "#f0b516";
  ctx.fill(wolfPath);
  ctx.restore();

  // Roma (#f0b516) + Flash (#e02d47)
  ctx.font = "800 58px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#f0b516";
  ctx.fillText("Roma", x + 106, y + 2);
  const romaW = ctx.measureText("Roma").width;
  ctx.fillStyle = "#e02d47";
  ctx.fillText("Flash", x + 106 + romaW, y + 2);

  // Slogan below
  ctx.font = "500 22px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.fillText(
    "L'essenza delle notizie giallorosse • romaflash.app",
    x + 108,
    y + 68
  );

  // Crisp Gold Separator Bar (identical on both slides)
  drawRoundedRect(ctx, x, y + 118, w, 4, 2);
  ctx.fillStyle = "rgba(240, 181, 22, 0.55)";
  ctx.fill();
}

function buildFullNewsText(aiSummary: any): string {
  const parts: string[] = [];
  if (aiSummary?.excerpt && typeof aiSummary.excerpt === "string") {
    parts.push(aiSummary.excerpt.trim());
  }
  const extraSources = [
    ...(Array.isArray(aiSummary?.bullets) ? aiSummary.bullets : []),
    ...(Array.isArray(aiSummary?.paragraphs) ? aiSummary.paragraphs : []),
    ...(typeof aiSummary?.summary === "string" ? [aiSummary.summary] : []),
  ];
  for (const item of extraSources) {
    if (item && typeof item === "string") {
      const clean = item.replace(/^[•\-*]\s*/, "").trim();
      if (clean && !parts.join(" ").includes(clean.slice(0, 28))) {
        parts.push(clean);
      }
    }
  }
  const combined = parts.join(" ").trim();
  return (
    combined ||
    "Leggi tutti i dettagli della notizia in tempo reale e senza pubblicità su romaflash.app."
  );
}

function renderSlide1Canvas(article: any): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d")!;

  drawUniformBackground(ctx);

  const safeX = 100;
  const safeW = 820;

  // 1. Fixed Header + Separator Bar
  drawCleanBrandHeader(ctx, safeX, safeW);

  // 2. Measure Title (100% White) + Expanded News Text (up to 9 lines)
  const title = article.title || "Notizia AS Roma";
  ctx.font = "900 52px system-ui, -apple-system, sans-serif";
  const titleLines = wrapText(ctx, title, safeW).slice(0, 4);
  const titleH = titleLines.length * 64;

  const fullNews = buildFullNewsText(article.ai_summary);
  ctx.font = "500 35px system-ui, -apple-system, sans-serif";
  const excerptLines = wrapText(ctx, fullNews, safeW - 44).slice(0, 9);
  const excerptH = excerptLines.length * 50;

  const bodyTotalH = titleH + 46 + excerptH;
  const bodyAreaTop = HEADER_BOTTOM_Y + 36; // 470
  const bodyAreaBottom = 1310;
  const bodyStartY = Math.max(
    bodyAreaTop,
    Math.round(bodyAreaTop + (bodyAreaBottom - bodyAreaTop - bodyTotalH) / 2)
  );

  // Main Headline (100% Pure White #ffffff)
  ctx.textBaseline = "top";
  ctx.font = "900 52px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  let y = bodyStartY;
  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillText(titleLines[i], safeX, y);
    y += 64;
  }

  // Expanded News Summary (Vertical Gold Accent Bar + Crisp Light Text)
  const summaryY = y + 46;
  drawRoundedRect(ctx, safeX, summaryY, 8, excerptH, 4);
  ctx.fillStyle = "#f0b516";
  ctx.fill();

  ctx.font = "500 35px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  let ey = summaryY - 4;
  for (const line of excerptLines) {
    ctx.fillText(line, safeX + 34, ey);
    ey += 50;
  }

  return canvas.toDataURL("image/png");
}

function renderSlide2Canvas(article: any): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d")!;

  drawUniformBackground(ctx);

  const safeX = 100;
  const safeW = 820;

  // 1. Fixed Header + Separator Bar (identical to Slide 1)
  drawCleanBrandHeader(ctx, safeX, safeW);

  const poll = article.ai_summary?.poll || {
    question: "Cosa ne pensi di questa notizia in casa giallorossa?",
    options: [
      "Ottima notizia, avanti così!",
      "Serve fare di più sul campo",
      "Aspettiamo la prossima partita",
    ],
  };

  // 2. Center Poll Question + 3 Options inside space below header
  ctx.font = "900 46px system-ui, -apple-system, sans-serif";
  const qLines = wrapText(ctx, poll.question, safeW).slice(0, 3);
  const qH = qLines.length * 58;

  ctx.font = "700 34px system-ui, -apple-system, sans-serif";
  const optRendered = (poll.options || []).slice(0, 3).map((opt: string) => {
    const lines = wrapText(ctx, opt, safeW - 130).slice(0, 2);
    const h = lines.length > 1 ? 142 : 114;
    return { lines, h };
  });
  const optionsTotalH =
    optRendered.reduce((acc: number, o: { h: number }) => acc + o.h, 0) +
    Math.max(0, optRendered.length - 1) * 24;

  const bodyTotalH = qH + 44 + optionsTotalH;
  const bodyAreaTop = HEADER_BOTTOM_Y + 36; // 470
  const bodyAreaBottom = 1310;
  const bodyStartY = Math.max(
    bodyAreaTop,
    Math.round(bodyAreaTop + (bodyAreaBottom - bodyAreaTop - bodyTotalH) / 2)
  );

  // Poll Question
  let qy = bodyStartY;
  ctx.textBaseline = "top";
  ctx.font = "900 46px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  for (const line of qLines) {
    ctx.fillText(line, safeX, qy);
    qy += 58;
  }

  // Options (Dark translucent cards + circular gold 1, 2, 3 badges)
  let oy = qy + 44;
  for (let i = 0; i < optRendered.length; i++) {
    const { lines: optLines, h: optBoxH } = optRendered[i];

    drawRoundedRect(ctx, safeX, oy, safeW, optBoxH, 22);
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(240, 181, 22, 0.45)";
    ctx.stroke();

    // Number badge circle (1, 2, 3)
    const badgeR = 28;
    const badgeX = safeX + 52;
    const badgeY = oy + optBoxH / 2;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = "#f0b516";
    ctx.fill();

    ctx.font = "900 30px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#2a070c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), badgeX, badgeY + 2);
    ctx.textAlign = "left";

    // Option text
    ctx.font = "700 34px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top";
    let textY = oy + (optLines.length > 1 ? 28 : 38);
    for (const l of optLines) {
      ctx.fillText(l, safeX + 104, textY);
      textY += 42;
    }

    oy += optBoxH + 24;
  }

  return canvas.toDataURL("image/png");
}

export default function TikTokKitModal({
  article,
  onClose,
  onMarkShared,
}: TikTokKitModalProps) {
  const [slide1Url, setSlide1Url] = useState<string>("");
  const [slide2Url, setSlide2Url] = useState<string>("");
  const [activeSlide, setActiveSlide] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!article) return;
    setSlide1Url(renderSlide1Canvas(article));
    setSlide2Url(renderSlide2Canvas(article));
    setActiveSlide(1);
    setCopied(false);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [article]);

  if (!article || typeof document === "undefined") return null;

  const baseText = (
    article.ai_summary?.tweet_text ||
    `🐺🟡🔴 ${article.title}\n\n${article.ai_summary?.excerpt || ""}`
  )
    .replace(/#[a-zA-Z0-9_]+/g, "")
    .trim();

  const extraTags = (article.ai_summary?.dynamic_hashtags || "")
    .replace(/#ASRoma/gi, "")
    .replace(/#RomaFlash/gi, "")
    .trim();

  const hashtags = `#ASRoma #RomaFlash ${extraTags ? `${extraTags} ` : ""}#SerieA #Roma #PerTe`;

  const tiktokCaption = `${baseText}\n\n📊 Scorri alla Slide 2 e vota il sondaggio: scrivi 1, 2 o 3 nei commenti! 👇\n\n⚡ Tutte le notizie giallorosse in tempo reale e ZERO pubblicità su romaflash.app (Link in Bio)\n\n${hashtags}`;

  const handleDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onMarkShared && article?.id) {
      onMarkShared(article.id, true);
    }
  };

  const handleShareBothMobile = async () => {
    try {
      const res1 = await fetch(slide1Url);
      const blob1 = await res1.blob();
      const res2 = await fetch(slide2Url);
      const blob2 = await res2.blob();

      const file1 = new File([blob1], "romaflash-tiktok-slide-1.png", {
        type: "image/png",
      });
      const file2 = new File([blob2], "romaflash-tiktok-slide-2.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file1, file2] })) {
        await navigator.share({
          files: [file1, file2],
          title: article.title,
          text: tiktokCaption,
        });
        if (onMarkShared && article?.id) {
          onMarkShared(article.id, true);
        }
      } else {
        handleDownload(slide1Url, "romaflash-tiktok-slide-1.png");
        setTimeout(() => {
          handleDownload(slide2Url, "romaflash-tiktok-slide-2.png");
        }, 350);
      }
    } catch {
      // User cancelled share or fallback
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
                Kit TikTok 2 Slide (1080×1920 HD)
              </h3>
              <p className="text-[11px] text-gray-500">
                Scarica le 2 locandine e copia la didascalia pronta per TikTok
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
            <div className="flex gap-2 mb-3 w-full justify-center">
              <button
                type="button"
                onClick={() => setActiveSlide(1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeSlide === 1
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Slide 1 (Notizia)
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide(2)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeSlide === 2
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Slide 2 (Sondaggio)
              </button>
            </div>

            {slide1Url && slide2Url && (
              <img
                src={activeSlide === 1 ? slide1Url : slide2Url}
                alt={`Slide ${activeSlide}`}
                className="w-[210px] md:w-[240px] rounded-2xl shadow-lg border border-gray-200"
              />
            )}
          </div>

          {/* Right: Download Buttons & Copyable Caption */}
          <div className="md:col-span-6 flex flex-col gap-3">
            {/* Download / Share Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  handleDownload(slide1Url, "romaflash-tiktok-slide-1.png")
                }
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Scarica Slide 1
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDownload(slide2Url, "romaflash-tiktok-slide-2.png")
                }
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Scarica Slide 2
              </button>
            </div>

            <button
              type="button"
              onClick={handleShareBothMobile}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-900 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              Invia / Salva entrambe su Smartphone
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
