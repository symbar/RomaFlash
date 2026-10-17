"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  Sparkles,
  Layers,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import { getArticleImageUrl } from "@/components/ArticleImage";
import { getArticleUrl } from "@/lib/slug";
import {
  renderSlide1,
  renderSlide2Outro,
  renderStoryCanvas,
  loadImageElement,
  toProxiedUrl,
  ensureFontsLoaded,
} from "@/lib/socialSlideGenerator";

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
  onMarkShared?: (articleId: string, shared: boolean) => void;
}

export type InstagramFormat = "carousel" | "story";

export function buildInstagramCaption(article: any): string {
  const title = (article?.title || "").trim();
  const excerpt = (article?.ai_summary?.excerpt || "").trim();
  const rawContent = (article?.ai_summary?.content || "").trim();

  // Pulizia del markdown per ottenere il testo completo e leggibile dell'articolo
  let fullBody = rawContent
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^>\s*/gm, "💬 ")
    .replace(/^[-•]\s+/gm, "• ")
    .trim();

  if (!fullBody) {
    fullBody = excerpt;
  } else if (
    excerpt &&
    fullBody.length < 200 &&
    !fullBody.toLowerCase().includes(excerpt.slice(0, 30).toLowerCase())
  ) {
    fullBody = `${excerpt}\n\n${fullBody}`;
  }

  const paragraphs = fullBody
    .split(/\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean);
  const bodyText = paragraphs.join("\n\n");

  const dynamicTags = (article?.ai_summary?.dynamic_hashtags || "")
    .split(/\s+/)
    .filter((t: string) => t.startsWith("#"))
    .slice(0, 4)
    .join(" ");

  let cta = "Cosa ne pensi? Dì la tua nei commenti! 👇🐺";
  const cat = article?.ai_summary?.category;
  if (cat === "Dichiarazioni") {
    cta = "Sei d'accordo con queste parole? Scrivilo nei commenti! 👇🐺";
  } else if (cat === "Probabili Formazioni") {
    cta = "Chi faresti giocare titolare? Scrivilo qui sotto! 👇🐺";
  } else if (cat === "Calciomercato") {
    cta = "Operazione giusta per la Roma? Commenta con la tua opinione! 👇🐺";
  }

  const tags = `#ASRoma #RomaFlash #SerieA #Calcio ${dynamicTags}`.trim();

  return `🐺 ${title} 🟡🔴\n\n${bodyText ? bodyText + "\n\n" : ""}${cta}\n\n📲 Segui @romaflash e tocca il link in Bio o nelle Storie per leggere l'approfondimento completo su www.romaflash.app!\n\n${tags}`;
}

export default function InstagramStoryModal({
  article,
  onClose,
  onMarkShared,
}: InstagramStoryModalProps) {
  // Formato predefinito: Carosello 4:5 (Standardizzato con TikTok)
  const [format, setFormat] = useState<InstagramFormat>("carousel");
  const [activeSlide, setActiveSlide] = useState<1 | 2>(1);

  // Risorse Carosello 4:5
  const [slide1Url, setSlide1Url] = useState<string>("");
  const [slide1File, setSlide1File] = useState<File | null>(null);
  const [slide2Url, setSlide2Url] = useState<string>("");
  const [slide2File, setSlide2File] = useState<File | null>(null);

  // Risorse Storia 9:16
  const [storyUrl, setStoryUrl] = useState<string>("");
  const [storyFile, setStoryFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [packDownloading, setPackDownloading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [sharedSuccess, setSharedSuccess] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [captionText, setCaptionText] = useState<string>("");

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }
  }, []);

  useEffect(() => {
    if (!article) return;
    setCaptionText(buildInstagramCaption(article));
  }, [article]);

  useEffect(() => {
    if (!article) return;
    let isMounted = true;
    setLoading(true);

    async function generateAll() {
      await ensureFontsLoaded();

      const rawImgUrl = getArticleImageUrl(article) || "/images/archive/roma-1.jpg";
      const proxiedImgUrl = toProxiedUrl(rawImgUrl);
      let bgImg = await loadImageElement(proxiedImgUrl);
      if (!bgImg) {
        bgImg = await loadImageElement("/images/archive/roma-1.jpg");
      }

      // 1. Slide 1 Carosello (4:5)
      const s1 = renderSlide1(article, bgImg);
      // 2. Slide 2 Outro Carosello (4:5)
      const s2 = renderSlide2Outro();
      // 3. Storia Verticale 9:16
      const st = renderStoryCanvas(article, bgImg);

      if (isMounted) {
        setSlide1Url(s1.dataUrl);
        setSlide2Url(s2.dataUrl);
        setStoryUrl(st.dataUrl);

        Promise.all([s1.filePromise, s2.filePromise, st.filePromise]).then(
          ([f1, f2, fStory]) => {
            if (isMounted) {
              setSlide1File(f1);
              setSlide2File(f2);
              setStoryFile(fStory);
              setLoading(false);
            }
          }
        );
      }
    }

    generateAll();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      isMounted = false;
      document.body.style.overflow = prevOverflow;
    };
  }, [article]);

  if (!article || typeof document === "undefined") return null;

  const articleUrl = getArticleUrl(article);
  const isCarousel = format === "carousel";

  const triggerDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      if (onMarkShared && article?.id) {
        onMarkShared(article.id, true);
      }
    } catch {
      // ignore
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionText);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 3000);
      if (onMarkShared && article?.id) {
        onMarkShared(article.id, true);
      }
    } catch {
      // ignore
    }
  };

  const handleDownloadSingle = () => {
    const shortId = article?.id ? String(article.id).slice(0, 8) : "news";

    if (isCarousel) {
      if (activeSlide === 1 && slide1Url) {
        triggerDownload(slide1Url, `romaflash-slide-1-${shortId}.jpg`);
      } else if (activeSlide === 2 && slide2Url) {
        triggerDownload(slide2Url, `romaflash-slide-2-outro.jpg`);
      }
    } else {
      if (storyUrl) {
        triggerDownload(storyUrl, `romaflash-storia-${shortId}.jpg`);
      }
    }

    if (onMarkShared && article?.id) {
      onMarkShared(article.id, true);
    }
  };

  const handleDownloadPack = () => {
    if (!slide1Url || !slide2Url) return;
    setPackDownloading(true);
    const shortId = article?.id ? String(article.id).slice(0, 8) : "news";

    triggerDownload(slide1Url, `romaflash-slide-1-${shortId}.jpg`);

    setTimeout(() => {
      triggerDownload(slide2Url, `romaflash-slide-2-outro.jpg`);
      setPackDownloading(false);
    }, 450);

    if (onMarkShared && article?.id) {
      onMarkShared(article.id, true);
    }
  };

  const handleShare = async () => {
    if (onMarkShared && article?.id) {
      onMarkShared(article.id, true);
    }

    // Copia preventiva automatica negli appunti:
    // in modalità Carosello copia la didascalia; in modalità Storia copia il link
    const textToCopy = isCarousel ? captionText : articleUrl;
    try {
      await navigator.clipboard?.writeText(textToCopy);
      if (isCarousel) {
        setCopiedCaption(true);
        setTimeout(() => setCopiedCaption(false), 3500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3500);
      }
    } catch {
      // ignore
    }

    const filesToShare = isCarousel
      ? [slide1File, slide2File].filter(Boolean) as File[]
      : [storyFile].filter(Boolean) as File[];

    if (
      filesToShare.length > 0 &&
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: filesToShare })
    ) {
      try {
        await navigator.share({
          files: filesToShare,
        });
        setSharedSuccess(true);
        setTimeout(() => setSharedSuccess(false), 4000);
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.warn("navigator.share non completato:", err);
      }
    }

    // Fallback: download
    if (isCarousel) {
      handleDownloadPack();
    } else {
      handleDownloadSingle();
    }
  };

  // Preview attualmente attiva
  const previewImgUrl = isCarousel
    ? activeSlide === 1
      ? slide1Url
      : slide2Url
    : storyUrl;

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
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">
                  Kit Instagram RomaFlash
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {isCarousel ? "Carosello 4:5 (Standard)" : "Storia 9:16"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Formato standardizzato con TikTok: Slide 1 (Notizia) + Slide 2 (Outro romaflash.app)
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
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Anteprima (Sinistra) */}
          <div className="md:col-span-5 flex flex-col items-center gap-2.5">
            {/* Switch Macro-Formato: Carosello 4:5 vs Storia 9:16 */}
            <div className="w-full max-w-[270px] flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setFormat("carousel")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isCarousel
                    ? "bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Carosello 4:5</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("story")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isCarousel
                    ? "bg-gradient-to-r from-purple-800 to-pink-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Storia 9:16</span>
              </button>
            </div>

            {/* Sub-selector Slide (se Carosello) */}
            {isCarousel && (
              <div className="w-full max-w-[270px] grid grid-cols-2 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setActiveSlide(1)}
                  className={`py-1 px-2 rounded text-[11px] font-bold transition-all text-center cursor-pointer ${
                    activeSlide === 1
                      ? "bg-slate-800 text-amber-300 shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  1. Notizia
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlide(2)}
                  className={`py-1 px-2 rounded text-[11px] font-bold transition-all text-center cursor-pointer ${
                    activeSlide === 2
                      ? "bg-slate-800 text-amber-300 shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  2. Outro Sito
                </button>
              </div>
            )}

            {/* Frame Grafica */}
            <div
              className={`relative w-full rounded-2xl overflow-hidden bg-black border-2 border-slate-700 shadow-2xl transition-all ${
                isCarousel
                  ? "max-w-[260px] aspect-[4/5]"
                  : "max-w-[230px] aspect-[9/16]"
              }`}
            >
              {loading || !previewImgUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Generazione HD...</span>
                </div>
              ) : (
                <img
                  src={previewImgUrl}
                  alt="Anteprima Instagram"
                  className="w-full h-full object-cover select-none"
                />
              )}
            </div>

            <span className="text-[10px] text-slate-400 text-center font-medium">
              {isCarousel
                ? activeSlide === 1
                  ? "Slide 1: Foto reale + Titolo bicolore + Super Sunto"
                  : "Slide 2: Mockup laptop/smartphone + Banner www.romaflash.app"
                : "Formato 9:16 con indicatore sticker link"}
            </span>
          </div>

          {/* Istruzioni e Azioni (Destra) */}
          <div className="md:col-span-7 space-y-3">
            {/* Box Didascalia Instagram (con @romaflash cliccabile) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  Didascalia Feed & Carosello (con @romaflash cliccabile):
                </span>
                <span className="text-[10px] text-pink-400 font-mono">
                  {copiedCaption ? "Copiata!" : "Modificabile"}
                </span>
              </div>
              <textarea
                rows={5}
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded-lg p-2.5 resize-y focus:outline-none font-sans leading-relaxed"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    copiedCaption
                      ? "bg-emerald-600 text-white"
                      : "bg-gradient-to-r from-purple-900 to-pink-900 hover:opacity-95 text-pink-200 border border-purple-500/40"
                  }`}
                >
                  {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCaption ? "Didascalia Copiata!" : "Copia Didascalia + Hashtag"}</span>
                </button>
              </div>
            </div>

            {/* Box Link Diretto Articolo (per Sticker Storie o Bio) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Link Articolo (per Sticker Link nelle Storie o in Bio):
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {copiedLink ? "Copiato!" : "100% cliccabile"}
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
                  {copiedLink ? "Copiato" : "Copia Link"}
                </button>
              </div>
            </div>

            {/* Guida Rapida */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
              <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                <span>{isCarousel ? "📸" : "📱"}</span> Come pubblicare su Instagram:
              </div>
              {isCarousel ? (
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>
                    Scarica il <strong className="text-amber-300">Pack 2 Slide</strong> oppure tocca <strong className="text-white">&quot;Condividi&quot;</strong> (la didascalia viene copiata in automatico).
                  </li>
                  <li>
                    Apri Instagram, tocca <strong className="text-white">+ &gt; Post</strong>, attiva la modalità <strong className="text-amber-300">Selezione multipla</strong> e scegli <strong className="text-white">Slide 1</strong> e <strong className="text-white">Slide 2</strong>.
                  </li>
                  <li>
                    Incolla la didascalia con la menzione <strong className="text-rose-300">@romaflash</strong> per renderla cliccabile per tutti i follower.
                  </li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>
                    Tocca <strong className="text-white">&quot;Condividi&quot;</strong> o scarica la Storia (il link viene copiato in automatico negli appunti).
                  </li>
                  <li>
                    Apri Instagram, tocca <strong className="text-rose-400">+ &gt; Storia</strong> e seleziona l&apos;immagine dalla galleria.
                  </li>
                  <li>
                    Tocca l&apos;icona sticker, seleziona <strong className="text-amber-400">Link</strong>, fai <strong className="text-white">Incolla</strong> e posizionalo sull&apos;adesivo grafico.
                  </li>
                </ol>
              )}
            </div>

            {/* Pulsanti Azione Principali */}
            <div className="space-y-2 pt-1">
              {isCarousel ? (
                <>
                  {/* SCARICA PACK 2 SLIDE (PRIMARIO) */}
                  <button
                    type="button"
                    onClick={handleDownloadPack}
                    disabled={loading || !slide1Url || !slide2Url || packDownloading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 active:scale-95 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Layers className="w-4 h-4 text-white" />
                    <span>
                      {packDownloading
                        ? "Download Pack in corso..."
                        : "Scarica Pack 2 Slide Carosello (4:5)"}
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadSingle}
                      disabled={loading || !previewImgUrl}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-800 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Scarica Slide {activeSlide}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={loading || !slide1File || !slide2File}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Condividi Pack</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={loading || !storyUrl}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:opacity-95 active:scale-95 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Condividi Storia 9:16</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSingle}
                    disabled={loading || !storyUrl}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Scarica Storia JPG (1080×1920)</span>
                  </button>
                </>
              )}
            </div>

            {sharedSuccess && (
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Pronto per Instagram!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
