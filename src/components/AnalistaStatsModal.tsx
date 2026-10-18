"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Share2, Copy, Check, BarChart3 } from "lucide-react";
import { getStatsForArticle, MatchStatsData } from "./MatchStatsWidget";
import { WOLF_LOGO_SVG_PATH } from "@/lib/socialSlideGenerator";

interface AnalistaStatsModalProps {
  article: any | null;
  onClose: () => void;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export function drawAnalistaPoster(
  canvas: HTMLCanvasElement,
  stats: MatchStatsData,
  homeImg?: HTMLImageElement | null,
  awayImg?: HTMLImageElement | null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = 1200;
  const height = 1200;
  canvas.width = width;
  canvas.height = height;

  // 1. Background gradient (Deep bordeaux to almost black)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#28050d");
  bgGrad.addColorStop(0.5, "#140306");
  bgGrad.addColorStop(1, "#0a0103");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient glow lights
  const radialGlow = ctx.createRadialGradient(150, 150, 20, 150, 150, 450);
  radialGlow.addColorStop(0, "rgba(240, 181, 22, 0.12)");
  radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  const radialGlow2 = ctx.createRadialGradient(width - 150, height - 150, 20, width - 150, height - 150, 500);
  radialGlow2.addColorStop(0, "rgba(142, 27, 35, 0.25)");
  radialGlow2.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = radialGlow2;
  ctx.fillRect(0, 0, width, height);

  // 3. Subtle background watermark
  ctx.save();
  ctx.fillStyle = "rgba(240, 181, 22, 0.03)";
  ctx.font = "900 240px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ROMA", width / 2, height / 2);
  ctx.restore();

  // 4. Outer golden border with rounded corners
  ctx.save();
  ctx.strokeStyle = "rgba(240, 181, 22, 0.6)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(40, 40, width - 80, height - 80, 36);
  ctx.stroke();
  ctx.restore();

  // 5. Header Brand Bar (Stile Ufficiale Header RomaFlash con Lupetto cerchiato)
  ctx.save();
  const badgeCx = 110;
  const badgeCy = 115;
  const badgeR = 36;

  // Cerchio bordeaux profondo #26050a
  ctx.fillStyle = "#26050a";
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
  ctx.fill();

  // Bordo dorato #f0b516
  ctx.strokeStyle = "#f0b516";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Lupetto dorato centrato nel cerchio
  const wolfSize = badgeR * 1.35;
  ctx.save();
  ctx.translate(badgeCx - wolfSize * 0.495, badgeCy - wolfSize * 0.515);
  const wolfScale = wolfSize / 512;
  ctx.scale(wolfScale, wolfScale);
  const wolfPath = new Path2D(WOLF_LOGO_SVG_PATH);
  ctx.fillStyle = "#f0b516";
  ctx.fill(wolfPath);
  ctx.restore();

  // Testo brand ufficiale: "Roma" (bianco) + "Flash" (rosso carminio #e02d47)
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "900 32px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Roma", 165, 116);
  const romaWidth = ctx.measureText("Roma").width;
  ctx.fillStyle = "#e02d47";
  ctx.fillText("Flash", 165 + romaWidth, 116);

  // Sottotitolo della rubrica
  ctx.fillStyle = "#f0b516";
  ctx.font = "800 16px sans-serif";
  ctx.fillText("L'ANALISTA • MATCH TELEMETRY REPORT", 165, 142);

  // Pillola competizione a destra
  ctx.fillStyle = "#f0b516";
  ctx.beginPath();
  ctx.roundRect(width - 240, 95, 150, 40, 20);
  ctx.fill();

  ctx.fillStyle = "#0c0204";
  ctx.font = "900 16px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(stats.competition, width - 165, 116);
  ctx.restore();

  // Separator
  ctx.strokeStyle = "rgba(240, 181, 22, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(70, 180);
  ctx.lineTo(width - 70, 180);
  ctx.stroke();

  // 6. Scoreboard Hero con Loghi Ufficiali Squadre (SENZA MARCATORI)
  ctx.save();
  ctx.fillStyle = "rgba(10, 2, 4, 0.7)";
  ctx.strokeStyle = "rgba(240, 181, 22, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(70, 210, width - 140, 130, 24);
  ctx.fill();
  ctx.stroke();

  // Home Team Logo & Card
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.strokeStyle = "rgba(240, 181, 22, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(95, 228, 94, 94, 18);
  ctx.fill();
  ctx.stroke();

  if (homeImg) {
    ctx.drawImage(homeImg, 107, 240, 70, 70);
  } else {
    ctx.fillStyle = "#f0b516";
    ctx.font = "900 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ASR", 142, 275);
  }
  ctx.restore();

  // Home Team Name (perfettamente centrato in altezza, senza marcatori)
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 34px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(stats.homeTeam, 210, 275);

  // Central Score badge
  const scoreGrad = ctx.createLinearGradient(width / 2 - 85, 225, width / 2 + 85, 315);
  scoreGrad.addColorStop(0, "#8e1b23");
  scoreGrad.addColorStop(1, "#540a11");
  ctx.fillStyle = scoreGrad;
  ctx.strokeStyle = "rgba(240, 181, 22, 0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(width / 2 - 85, 235, 170, 80, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f0b516";
  ctx.font = "900 46px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${stats.homeScore} - ${stats.awayScore}`, width / 2, 277);

  // Away Team Logo & Card
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(width - 189, 228, 94, 94, 18);
  ctx.fill();
  ctx.stroke();

  if (awayImg) {
    ctx.drawImage(awayImg, width - 177, 240, 70, 70);
  } else {
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "900 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GEN", width - 142, 275);
  }
  ctx.restore();

  // Away Team Name (perfettamente centrato in altezza, senza marcatori)
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "900 34px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(stats.awayTeam, width - 210, 275);
  ctx.restore();

  // 7. Stats Bars Cards
  const metrics = [
    {
      label: "POSSESSO PALLA",
      homeVal: `${stats.possession.home}%`,
      awayVal: `${stats.possession.away}%`,
      homeRatio: stats.possession.home / 100,
    },
    {
      label: "TIRI TOTALI (IN PORTA)",
      homeVal: `${stats.shots.home} (${stats.shots.homeOnTarget})`,
      awayVal: `(${stats.shots.awayOnTarget}) ${stats.shots.away}`,
      homeRatio: (stats.shots.home / (stats.shots.home + stats.shots.away)) || 0.5,
    },
    {
      label: "PASSAGGI RIUSCITI (PRECISIONE)",
      homeVal: `${stats.passes.home} (${stats.passes.homeAcc}%)`,
      awayVal: `(${stats.passes.awayAcc}%) ${stats.passes.away}`,
      homeRatio: (stats.passes.home / (stats.passes.home + stats.passes.away)) || 0.5,
    },
    {
      label: "CONTRASTI VINTI",
      homeVal: stats.tackles ? `${stats.tackles.homeWon}/${stats.tackles.homeTotal} (${stats.tackles.homeAcc}%)` : "N/D",
      awayVal: stats.tackles ? `${stats.tackles.awayWon}/${stats.tackles.awayTotal} (${stats.tackles.awayAcc}%)` : "N/D",
      homeRatio: stats.tackles ? (stats.tackles.homeWon / (stats.tackles.homeWon + stats.tackles.awayWon)) : 0.5,
    },
    {
      label: "RESPINTE DIFENSIVE",
      homeVal: stats.clearances ? `${stats.clearances.home}` : "N/D",
      awayVal: stats.clearances ? `${stats.clearances.away}` : "N/D",
      homeRatio: stats.clearances ? (stats.clearances.home / (stats.clearances.home + stats.clearances.away)) : 0.5,
    },
  ];

  let currentY = 370;
  const cardHeight = 105;
  const gap = 16;
  const barW = width - 180;

  for (const m of metrics) {
    ctx.save();
    // Card background
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(70, currentY, width - 140, cardHeight, 18);
    ctx.fill();
    ctx.stroke();

    // Values & Label
    // Home value (Gold)
    ctx.fillStyle = "#f0b516";
    ctx.font = "900 24px monospace";
    ctx.textAlign = "left";
    ctx.fillText(m.homeVal, 95, currentY + 42);

    // Metric Label (Center)
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "800 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(m.label, width / 2, currentY + 40);

    // Away value (Slate)
    ctx.fillStyle = "#94a3b8";
    ctx.font = "900 24px monospace";
    ctx.textAlign = "right";
    ctx.fillText(m.awayVal, width - 95, currentY + 42);

    // Progress Bar Track
    const barX = 90;
    const barY = currentY + 62;
    const barH = 16;
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 8);
    ctx.fill();

    // Home progress portion (Gold gradient)
    const homeW = Math.max(10, Math.min(barW - 10, barW * m.homeRatio));
    const barGrad = ctx.createLinearGradient(barX, barY, barX + homeW, barY);
    barGrad.addColorStop(0, "#d99708");
    barGrad.addColorStop(1, "#facc15");
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, homeW, barH, 8);
    ctx.fill();

    ctx.restore();
    currentY += cardHeight + gap;
  }

  // 8. Verdict pill
  if (stats.verdict) {
    ctx.save();
    ctx.fillStyle = "rgba(240, 181, 22, 0.1)";
    ctx.strokeStyle = "rgba(240, 181, 22, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(70, currentY + 5, width - 140, 60, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f0b516";
    ctx.font = "800 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("📌 Verdetto:", 95, currentY + 42);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 18px sans-serif";
    ctx.fillText(stats.verdict, 225, currentY + 42);
    ctx.restore();
  }

  // 9. Footer Brand Info
  ctx.save();
  ctx.strokeStyle = "rgba(240, 181, 22, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(70, height - 120);
  ctx.lineTo(width - 70, height - 120);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 20px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("🐺 Tutti i report e match insights su ", 80, height - 75);

  ctx.fillStyle = "#f0b516";
  ctx.font = "800 20px sans-serif";
  ctx.fillText("romaflash.app", 440, height - 75);

  ctx.fillStyle = "#f0b516";
  ctx.font = "900 22px monospace";
  ctx.textAlign = "right";
  ctx.fillText("@ROMAFLASH", width - 80, height - 75);
  ctx.restore();
}

export default function AnalistaStatsModal({ article, onClose }: AnalistaStatsModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = article ? getStatsForArticle(article) : null;

  useEffect(() => {
    let isMounted = true;
    if (!stats || !canvasRef.current) return;

    // 1. Initial draw with fallbacks
    drawAnalistaPoster(canvasRef.current, stats);

    // 2. Load high-res images and re-render with official logos
    const renderWithLogos = async () => {
      try {
        const [homeImg, awayImg] = await Promise.all([
          loadImg(stats.homeLogo).catch(() => null),
          loadImg(stats.awayLogo).catch(() => null),
        ]);
        if (isMounted && canvasRef.current) {
          drawAnalistaPoster(canvasRef.current, stats, homeImg, awayImg);
        }
      } catch (e) {
        console.warn("Logo loading fallback:", e);
      }
    };

    renderWithLogos();

    return () => {
      isMounted = false;
    };
  }, [stats]);

  if (!mounted || !article || !stats) return null;

  const handleShare = async () => {
    if (!canvasRef.current) return;
    setSharing(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current?.toBlob(resolve, "image/png")
      );
      if (!blob) return;

      const filename = `scheda-statistiche-${stats.homeTeam.toLowerCase()}-${stats.awayTeam.toLowerCase()}.png`.replace(/\s+/g, "-");
      const file = new File([blob], filename, { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${stats.homeTeam} ${stats.homeScore}-${stats.awayScore} ${stats.awayTeam} | RomaFlash L'Analista`,
          text: `Ecco le statistiche ufficiali del match ${stats.homeTeam}-${stats.awayTeam}: report telemetrico de L'Analista su RomaFlash.`,
          files: [file],
        });
      } else {
        // Fallback al download diretto dell'immagine
        const dataUrl = canvasRef.current.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Errore condivisione:", err);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch (err) {
          console.error("Errore copia appunti:", err);
        }
      });
    } catch (err) {
      console.error("Errore generazione blob:", err);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#1c0409] to-[#0c0204] border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 border-b border-amber-500/20 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono font-black text-amber-400 tracking-wider block">
                ROMAFLASH • L'ANALISTA
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                Scheda Grafica Partita
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-black/20">
          <div className="w-full max-w-lg shadow-2xl rounded-2xl overflow-hidden border border-amber-500/30">
            <canvas
              ref={canvasRef}
              className="w-full h-auto block"
              style={{ maxHeight: "65vh", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-amber-500/20 bg-black/50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Risoluzione broadcast nativa (1200x1200px) pronta per social & share.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiata!" : "Copia Immagine"}
            </button>

            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              {sharing ? "Elaborazione..." : "Condividi"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
