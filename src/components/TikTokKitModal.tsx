"use client";

import React, { useEffect, useState } from "react";
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

function drawBrandHeader(
  ctx: CanvasRenderingContext2D,
  rightBadgeText: string,
  isGoldBadge: boolean
) {
  // Badge Box (88x88)
  drawRoundedRect(ctx, 72, 90, 92, 92, 24);
  ctx.fillStyle = "#5a101b";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#f0b516";
  ctx.stroke();

  // Wolf Polygon inside badge
  ctx.save();
  ctx.translate(86, 104);
  ctx.scale(0.64, 0.64);
  const wolfPath = new Path2D(
    "M92 38L72 28L76 10L56 22L44 8L40 24L20 18L28 36L10 42L26 54L12 68L34 66L26 86L48 74L60 72L66 56L88 54L74 44L92 38Z"
  );
  ctx.fillStyle = "#f0b516";
  ctx.fill(wolfPath);
  const boltPath = new Path2D(
    "M52 36L64 34L56 44L68 42L50 56L54 44L44 46L52 36Z"
  );
  ctx.fillStyle = "#8e1f2f";
  ctx.fill(boltPath);
  ctx.restore();

  // RomaFlash Text
  ctx.font = "900 54px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Roma", 184, 96);
  const romaW = ctx.measureText("Roma").width;
  ctx.fillStyle = "#f0b516";
  ctx.fillText("Flash", 184 + romaW, 96);

  ctx.font = "600 24px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#fbd38d";
  ctx.fillText("romaflash.app", 184, 156);

  // Right Pill
  ctx.font = "900 28px system-ui, -apple-system, sans-serif";
  const pillText = rightBadgeText.toUpperCase();
  const textW = ctx.measureText(pillText).width;
  const pillW = textW + 64;
  const pillH = 64;
  const pillX = 1080 - 72 - pillW;
  const pillY = 104;

  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 32);
  ctx.fillStyle = isGoldBadge ? "#f0b516" : "rgba(255,255,255,0.16)";
  ctx.fill();

  ctx.fillStyle = isGoldBadge ? "#4a0e17" : "#f0b516";
  ctx.textBaseline = "middle";
  ctx.fillText(pillText, pillX + 32, pillY + pillH / 2 + 2);
}

function renderSlide1Canvas(article: any): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d")!;

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, "#8e1f2f");
  grad.addColorStop(0.55, "#63131f");
  grad.addColorStop(1, "#180408");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Subtle decorative glow circle
  const radGrad = ctx.createRadialGradient(540, 500, 50, 540, 500, 650);
  radGrad.addColorStop(0, "rgba(240, 181, 22, 0.14)");
  radGrad.addColorStop(1, "rgba(240, 181, 22, 0)");
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, 1080, 1920);

  const category = article.ai_summary?.category || "Notizia";
  drawBrandHeader(ctx, category, true);

  // Kicker
  ctx.textBaseline = "top";
  ctx.font = "900 30px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#f0b516";
  ctx.fillText("⚡ ULTIM'ORA GIALLOROSSA", 72, 265);

  // Main Headline
  const title = article.title || "Notizia AS Roma";
  ctx.font = "900 66px system-ui, -apple-system, sans-serif";
  const titleLines = wrapText(ctx, title, 936).slice(0, 5);
  let y = 325;
  for (let i = 0; i < titleLines.length; i++) {
    // Highlight last line in gold for visual punch
    ctx.fillStyle = i === titleLines.length - 1 && titleLines.length > 1 ? "#f0b516" : "#ffffff";
    ctx.fillText(titleLines[i], 72, y);
    y += 80;
  }

  // White Summary Box
  const excerpt =
    article.ai_summary?.excerpt ||
    "Leggi tutti i dettagli della notizia in tempo reale su romaflash.app.";
  ctx.font = "600 40px system-ui, -apple-system, sans-serif";
  const excerptLines = wrapText(ctx, excerpt, 820).slice(0, 6);

  const boxY = Math.max(y + 50, 760);
  const boxH = 140 + excerptLines.length * 56;

  drawRoundedRect(ctx, 72, boxY, 936, boxH, 36);
  ctx.fillStyle = "rgba(255, 255, 255, 0.97)";
  ctx.fill();

  // Gold left accent bar inside white card
  drawRoundedRect(ctx, 72, boxY, 18, boxH, 9);
  ctx.fillStyle = "#f0b516";
  ctx.fill();

  ctx.font = "900 28px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#8e1f2f";
  ctx.fillText("📄 LA NOTIZIA IN SINTESI", 124, boxY + 42);

  ctx.font = "600 40px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#1f2937";
  let ey = boxY + 98;
  for (const line of excerptLines) {
    ctx.fillText(line, 124, ey);
    ey += 56;
  }

  // Bottom Swipe Call-to-Action Box
  const ctaY = 1520;
  drawRoundedRect(ctx, 72, ctaY, 936, 118, 28);
  ctx.fillStyle = "#f0b516";
  ctx.fill();

  ctx.font = "900 38px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#4a0e17";
  ctx.textBaseline = "middle";
  ctx.fillText("📊 Scorri e vota il Sondaggio Tifosi", 112, ctaY + 59);

  ctx.textAlign = "right";
  ctx.fillText("👉 1/2", 968, ctaY + 59);
  ctx.textAlign = "left";

  // Bottom Footer Domain
  ctx.font = "700 30px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "center";
  ctx.fillText(
    "Tutte le notizie senza pubblicità su ROMAFLASH.APP",
    540,
    1730
  );
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

function renderSlide2Canvas(article: any): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d")!;

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, "#180408");
  grad.addColorStop(0.5, "#63131f");
  grad.addColorStop(1, "#8e1f2f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  drawBrandHeader(ctx, "SLIDE 2/2", false);

  const poll = article.ai_summary?.poll || {
    question: "Cosa ne pensi di questa notizia in casa giallorossa?",
    options: [
      "Ottima notizia, avanti così!",
      "Serve fare di più sul campo",
      "Aspettiamo la prossima partita",
    ],
  };

  // White Poll Card
  const cardY = 270;
  const cardH = 1160;
  drawRoundedRect(ctx, 72, cardY, 936, cardH, 40);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#f0b516";
  ctx.stroke();

  ctx.textBaseline = "top";
  ctx.font = "900 30px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#8e1f2f";
  ctx.fillText("📊 LA PAROLA AI TIFOSI GIALLOROSSI", 128, cardY + 56);

  // Poll Question
  ctx.font = "900 50px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#111827";
  const qLines = wrapText(ctx, poll.question, 824).slice(0, 4);
  let qy = cardY + 120;
  for (const line of qLines) {
    ctx.fillText(line, 128, qy);
    qy += 64;
  }

  // Options (1, 2, 3)
  const badges = ["1️⃣", "2️⃣", "3️⃣"];
  const options: string[] = (poll.options || []).slice(0, 3);
  let oy = Math.max(qy + 44, cardY + 380);

  for (let i = 0; i < options.length; i++) {
    const optText = `${badges[i] || `${i + 1}.`}  ${options[i]}`;
    ctx.font = "800 38px system-ui, -apple-system, sans-serif";
    const optLines = wrapText(ctx, optText, 760).slice(0, 2);
    const optBoxH = optLines.length > 1 ? 185 : 140;

    drawRoundedRect(ctx, 124, oy, 832, optBoxH, 28);
    ctx.fillStyle = i === 0 ? "#fdf2f4" : "#f3f4f6";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = i === 0 ? "#8e1f2f" : "#d1d5db";
    ctx.stroke();

    ctx.fillStyle = i === 0 ? "#8e1f2f" : "#1f2937";
    let textY = oy + (optLines.length > 1 ? 38 : 48);
    for (const l of optLines) {
      ctx.fillText(l, 164, textY);
      textY += 50;
    }

    oy += optBoxH + 34;
  }

  // Bottom Gold CTA Box
  const ctaY = 1500;
  drawRoundedRect(ctx, 72, ctaY, 936, 130, 28);
  ctx.fillStyle = "#f0b516";
  ctx.fill();

  ctx.font = "900 35px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#4a0e17";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "💬 Scrivi 1, 2 o 3 nei commenti qui sotto!",
    540,
    ctaY + 65
  );

  ctx.font = "700 30px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(
    "Oppure vota il sondaggio in tempo reale su ROMAFLASH.APP",
    540,
    1720
  );
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

export default function TikTokKitModal({
  article,
  onClose,
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
  }, [article]);

  if (!article) return null;

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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white border border-border rounded-2xl max-w-3xl w-full p-4 md:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
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
                className="w-[230px] md:w-[250px] rounded-2xl shadow-lg border border-gray-200"
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
    </div>
  );
}
