"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Copy,
  Check,
  Share2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { getArticleImageUrl } from "@/components/ArticleImage";
import {
  renderSlide1,
  renderSlide2Outro,
  loadImageElement,
  toProxiedUrl,
  ensureFontsLoaded,
} from "@/lib/socialSlideGenerator";

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

export function buildTikTokCaption(article: any): string {
  if (!article) return "";

  const title = (article.title || "").trim();

  // Testo principale / Spiegazione approfondita
  let fullContent = (article.ai_summary?.content || article.content || "").trim();
  const excerpt = (article.ai_summary?.excerpt || "").trim();

  // Se content non è presente o è troppo stringato (< 180 caratteri), integralo con l'excerpt
  if (!fullContent) {
    fullContent = excerpt;
  } else if (
    excerpt &&
    fullContent.length < 200 &&
    !fullContent.toLowerCase().includes(excerpt.substring(0, 30).toLowerCase())
  ) {
    fullContent = `${excerpt}\n\n${fullContent}`;
  }

  // Pulisci e formatta i paragrafi in modo ordinato
  const paragraphs = fullContent
    .split(/\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  const body = paragraphs.join("\n\n");

  // Hashtag dinamici e fissi ottimizzati per TikTok
  const extraTags = (article.ai_summary?.dynamic_hashtags || "")
    .replace(/#ASRoma/gi, "")
    .replace(/#RomaFlash/gi, "")
    .replace(/#Romanisti/gi, "")
    .replace(/#CurvaSudRoma/gi, "")
    .replace(/#SerieA/gi, "")
    .replace(/#PerTe/gi, "")
    .replace(/#ForYou/gi, "")
    .replace(/#Calcio/gi, "")
    .trim();

  const formattedExtraTags = extraTags
    ? extraTags
        .split(/\s+/)
        .filter(Boolean)
        .map((t: string) => (t.startsWith("#") ? t.toLowerCase() : `#${t.toLowerCase()}`))
        .join(" ")
    : "";

  const hashtags = `#asroma #romaflash #seriea #calcio #perte #foryou${
    formattedExtraTags ? ` ${formattedExtraTags}` : ""
  }`;

  // Intestazione con emoji
  const header = `🐺 ${title} 🟡🔴`;

  // Assembliamo la didascalia: Titolo + Notizia approfondita + Hashtag
  let caption = `${header}\n\n${body}\n\n${hashtags}`;

  // Se supera 2.100 caratteri, tronchiamo delicatamente sul punto fermo
  if (caption.length > 2100) {
    const maxBodyLen = 2100 - (header.length + hashtags.length + 20);
    if (maxBodyLen > 100) {
      let cut = body.slice(0, maxBodyLen);
      const lastDot = cut.lastIndexOf(".");
      if (lastDot > 100) {
        cut = cut.slice(0, lastDot + 1);
      }
      caption = `${header}\n\n${cut}\n\n${hashtags}`;
    }
  }

  return caption;
}

export default function TikTokKitModal({
  article,
  onClose,
  onMarkShared,
}: TikTokKitModalProps) {
  const [activeSlide, setActiveSlide] = useState<1 | 2>(1);
  const [slide1Url, setSlide1Url] = useState<string>("");
  const [slide1File, setSlide1File] = useState<File | null>(null);
  const [slide2Url, setSlide2Url] = useState<string>("");
  const [slide2File, setSlide2File] = useState<File | null>(null);

  const [generating, setGenerating] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [captionText, setCaptionText] = useState<string>("");

  useEffect(() => {
    if (!article) return;
    setCaptionText(buildTikTokCaption(article));
  }, [article]);

  useEffect(() => {
    if (!article) return;
    let cancelled = false;
    setGenerating(true);
    setCopied(false);

    async function generateSlides() {
      await ensureFontsLoaded();

      const mainImgUrl = getArticleImageUrl(article) || "/images/archive/roma-1.jpg";
      let loadedImg = await loadImageElement(toProxiedUrl(mainImgUrl));
      if (!loadedImg) {
        loadedImg = await loadImageElement("/images/archive/roma-1.jpg");
      }

      // Slide 1: Locandina Notizia
      const s1 = renderSlide1(article, loadedImg);
      // Slide 2: Locandina Outro romaflash.app (Mockup B)
      const s2 = renderSlide2Outro();

      if (!cancelled) {
        setSlide1Url(s1.dataUrl);
        setSlide2Url(s2.dataUrl);

        Promise.all([s1.filePromise, s2.filePromise]).then(([f1, f2]) => {
          if (!cancelled) {
            setSlide1File(f1);
            setSlide2File(f2);
            setGenerating(false);
          }
        });
      }
    }

    generateSlides();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelled = true;
      document.body.style.overflow = prevOverflow;
    };
  }, [article]);

  if (!article || typeof document === "undefined") return null;

  const handleShareMobile = async () => {
    if (onMarkShared && article?.id) {
      onMarkShared(article.id, true);
    }

    const filesToShare = [slide1File, slide2File].filter(Boolean) as File[];

    if (
      filesToShare.length > 0 &&
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: filesToShare })
    ) {
      try {
        await navigator.share({
          files: filesToShare,
          title: article.title,
          text: captionText,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.warn("navigator.share non completato:", err);
      }
    }

    // Fallback Desktop / Browser che non supportano navigator.share con files:
    // Scarica le 2 slide tramite ObjectURL reale
    if (slide1File) {
      const u1 = URL.createObjectURL(slide1File);
      const a1 = document.createElement("a");
      a1.href = u1;
      a1.download = slide1File.name;
      document.body.appendChild(a1);
      a1.click();
      setTimeout(() => {
        document.body.removeChild(a1);
        URL.revokeObjectURL(u1);
      }, 1000);
    }

    if (slide2File) {
      setTimeout(() => {
        const u2 = URL.createObjectURL(slide2File);
        const a2 = document.createElement("a");
        a2.href = u2;
        a2.download = slide2File.name;
        document.body.appendChild(a2);
        a2.click();
        setTimeout(() => {
          document.body.removeChild(a2);
          URL.revokeObjectURL(u2);
        }, 1000);
      }, 500);
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const currentPreviewUrl = activeSlide === 1 ? slide1Url : slide2Url;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white border border-border rounded-2xl max-w-3xl w-full p-4 md:p-6 shadow-2xl max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-black text-white shadow-xs">
              <TikTokIcon className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-black text-gray-900">
                  Kit TikTok Carosello (2 Slide 4:5)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  1080×1350
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Slide 1 (Notizia + Super Sunto) + Slide 2 (Outro locandina www.romaflash.app)
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
          {/* Left: Slide Selector & Preview */}
          <div className="md:col-span-6 flex flex-col items-center gap-3">
            {/* Tabs Selezione Slide 1 / Slide 2 */}
            <div className="w-full max-w-[280px] grid grid-cols-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setActiveSlide(1)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSlide === 1
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200/80"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <span>1. Notizia</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide(2)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSlide === 2
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200/80"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <span>2. Outro Sito</span>
              </button>
            </div>

            {/* Canvas Preview */}
            <div className="relative w-[250px] md:w-[280px] aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gray-950">
              {generating || !currentPreviewUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-400 font-semibold gap-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Generazione 2 slide...</span>
                </div>
              ) : (
                <img
                  src={currentPreviewUrl}
                  alt={`Slide ${activeSlide}`}
                  className="w-full h-full object-cover select-none"
                />
              )}
            </div>

            <p className="text-[11px] text-gray-500 text-center font-medium">
              {activeSlide === 1 ? (
                <span>📍 <strong>Slide 1:</strong> Foto reale + Titolo + Super Sunto completo</span>
              ) : (
                <span>🎯 <strong>Slide 2:</strong> Maxi Stemma + Streetwear Poster + Box romaflash.app</span>
              )}
            </p>
          </div>

          {/* Right: Single Share/Save Button & Caption */}
          <div className="md:col-span-6 flex flex-col gap-3">
            {/* PULSANTE UNICO CONDIVIDI / SALVA 2 SLIDE */}
            <button
              type="button"
              disabled={generating || !slide1Url || !slide2Url}
              onClick={handleShareMobile}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-sm font-black shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              <Share2 className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Condividi 2 Slide (o Salva su Smartphone)</span>
            </button>

            {/* Caption Box */}
            <div className="bg-gray-50 border border-border rounded-xl p-3 mt-0.5 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 truncate">
                    Didascalia TikTok
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-full shrink-0">
                    {captionText.length} car.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCaptionText(buildTikTokCaption(article))}
                    title="Ripristina didascalia originale"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">Ripristina</span>
                  </button>
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
              </div>

              <textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                rows={7}
                className="w-full text-xs text-gray-800 bg-white border border-gray-200 rounded-lg p-2.5 font-sans leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                placeholder="Didascalia approfondita per TikTok..."
              />

              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/80 text-[10.5px] text-amber-900 leading-snug flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Come pubblicare su TikTok:</strong> tocca <strong>Condividi</strong> per inviare o salvare le 2 immagini &gt; su TikTok tocca <strong>+</strong> &gt; modalità <strong>Foto</strong> &gt; seleziona Slide 1 e Slide 2 &gt; incolla la didascalia.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
