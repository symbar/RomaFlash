"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  ExternalLink,
  Check,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Clock,
  Layers,
} from "lucide-react";
import { WolfLogo } from "@/components/Icons";
import { getArticleImageUrl } from "@/components/ArticleImage";
import { generateArticleSlug } from "@/lib/slug";

export function XLogoIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface XPublishModalProps {
  article: any | null;
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (updatedArticle: any) => void;
}

export default function XPublishModal({
  article,
  isOpen,
  onClose,
  onPublished,
}: XPublishModalProps) {
  const [mounted, setMounted] = useState(false);
  const [tweetText, setTweetText] = useState("");
  const [includeThread, setIncludeThread] = useState(true);
  const [threadComment, setThreadComment] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [liveTweetUrl, setLiveTweetUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Inizializza il testo del tweet e il thread comment all'apertura
  useEffect(() => {
    if (!article) return;

    const ai = article.ai_summary || {};
    let initialTweet = (ai.tweet_text || "").trim();

    // Se non è presente un tweet_text, costruisci la formula a 3 blocchi come fallback
    if (!initialTweet) {
      const title = (article.title || "").replace(/\*\*/g, "").trim();
      const excerpt = (ai.excerpt || "").replace(/\*\*/g, "").trim();
      initialTweet = `🚨 ${title}.\n\n${excerpt}\n\nCosa ne pensate di questa scelta? ⬇️`;
    }

    // Assicura che gli hashtag siano inclusi se mancanti
    const extraTags = (ai.dynamic_hashtags || "")
      .replace(/#ASRoma/gi, "")
      .replace(/#RomaFlash/gi, "")
      .trim();
    const tagSuffix = `#ASRoma${extraTags ? ` ${extraTags}` : ""}`;

    if (!initialTweet.includes("#ASRoma")) {
      initialTweet = `${initialTweet}\n\n${tagSuffix}`.trim();
    }

    setTweetText(initialTweet);

    // Primo commento / thread con link pulito
    const slug = generateArticleSlug(article.title || "", article.id);
    const initialThread = `📖 Approfondimento completo e dati su RomaFlash:\nhttps://romaflash.app/notizie/${slug}`;
    setThreadComment(initialThread);

    setPublishSuccess(false);
    setPublishError(null);
    setLiveTweetUrl(article.ai_summary?.x_tweet_url || null);
  }, [article, isOpen]);

  if (!mounted || !isOpen || !article) return null;

  const imageUrl = getArticleImageUrl(article);
  const isAlreadyPublished = Boolean(article.ai_summary?.x_tweet_id);
  const postedAtStr = article.ai_summary?.x_posted_at
    ? new Date(article.ai_summary.x_posted_at).toLocaleString("it-IT", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Rome",
      })
    : null;

  const tweetCharCount = tweetText.length;
  const isTooLong = tweetCharCount > 280;
  const isIdealLength = tweetCharCount >= 80 && tweetCharCount <= 160;

  const handlePublish = async () => {
    if (!tweetText.trim()) return;
    setIsPublishing(true);
    setPublishError(null);

    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kkjxmjbuzgarxllbzkil.supabase.co";
      const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtranhtamJ1emdhcnhsbGJ6a2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDcxNDQsImV4cCI6MjEwNjAyMzE0NH0.GahiUgIxEJf_KZ5bC7hTXdUr6o67VOLUcCollg8wKgM";

      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-news`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          republishXArticleId: article.id,
          customTweetText: tweetText.trim(),
          customCommentText: includeThread && threadComment.trim() ? threadComment.trim() : null,
          includeThreadComment: includeThread,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Errore sconosciuto durante la pubblicazione su X.");
      }

      setPublishSuccess(true);
      if (result.tweetUrl) {
        setLiveTweetUrl(result.tweetUrl);
      }

      // Notifica il genitore per aggiornare la riga su /stats
      if (onPublished) {
        const updatedSummary = {
          ...(article.ai_summary || {}),
          x_tweet_id: result.tweetId,
          x_tweet_url: result.tweetUrl || liveTweetUrl,
          x_posted_at: new Date().toISOString(),
          tweet_text: tweetText.trim(),
        };
        onPublished({
          ...article,
          ai_summary: updatedSummary,
        });
      }
    } catch (err: any) {
      console.error("Errore pubblicazione X:", err);
      setPublishError(err.message || String(err));
    } finally {
      setIsPublishing(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shadow-xs">
              <XLogoIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-none text-gray-900 flex items-center gap-2">
                Pubblica su 𝕏
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 text-gray-700">
                  Buffer API
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Formula a 3 blocchi (Hook + Dettaglio + Bivio) & Thread link
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Modale Scrollabile */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Banner Stato Pubblicazione Precedente */}
          {isAlreadyPublished && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Già pubblicato su X{" "}
                  {postedAtStr ? <strong>il {postedAtStr}</strong> : ""}
                </span>
              </div>
              {liveTweetUrl && (
                <a
                  href={liveTweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-amber-800 hover:underline shrink-0"
                >
                  Apri post
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Feedback Successo */}
          {publishSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col gap-2 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 font-black text-emerald-800 text-sm">
                <Check className="w-4 h-4" />
                Tweet inviato con successo a Buffer!
              </div>
              <p className="text-xs text-emerald-800">
                Il tweet principale e il primo commento sono stati inviati all'account ufficiale di RomaFlash.
              </p>
              {liveTweetUrl && (
                <a
                  href={liveTweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-black hover:bg-gray-800 px-3.5 py-2 rounded-xl w-fit transition-colors"
                >
                  Visualizza ora su 𝕏
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Feedback Errore */}
          {publishError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Errore durante l'invio:</strong> {publishError}
              </div>
            </div>
          )}

          {/* Editor Testo Tweet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="tweet-textarea" className="font-extrabold text-gray-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Testo Tweet Principale (Senza Link)
              </label>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span
                  className={`font-bold px-2 py-0.5 rounded-full ${
                    isTooLong
                      ? "bg-red-100 text-red-700 font-black"
                      : isIdealLength
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tweetCharCount}/280 car.
                </span>
                {isIdealLength && (
                  <span className="text-emerald-600 font-sans text-[10px] hidden sm:inline">
                    (Perfetto!)
                  </span>
                )}
              </div>
            </div>

            <textarea
              id="tweet-textarea"
              rows={4}
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              placeholder="Inserisci il tweet con Hook + Dettaglio + Bivio..."
              className="w-full text-sm font-sans p-3 rounded-2xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition-all leading-relaxed text-gray-900 bg-white"
            />
            <p className="text-[11px] text-gray-500">
              💡 <em>Formula consigliata:</em> 1. Notizia secca (8 parole) ➔ 2. Dato o virgolettato ➔ 3. Domanda a bivio per i commenti.
            </p>
          </div>

          {/* Anteprima Live Box in Stile Twitter */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Anteprima Live Feed 𝕏
            </div>

            {/* Post Padre */}
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#26050a] flex items-center justify-center p-1.5 shrink-0 border border-[#f0b516]/60 shadow-xs">
                <WolfLogo className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-extrabold text-gray-900">RomaFlash</span>
                  <span className="text-gray-400 font-mono text-[11px]">@romaflashoffici</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400 text-[11px]">ora</span>
                </div>
                <div className="text-xs text-gray-800 font-sans mt-1 whitespace-pre-wrap leading-relaxed">
                  {tweetText || <span className="text-gray-400 italic">Il testo del tweet comparirà qui...</span>}
                </div>

                {/* Immagine allegata */}
                {imageUrl && (
                  <div className="mt-2.5 rounded-xl overflow-hidden border border-gray-200 aspect-[16/9] bg-black/5 relative group">
                    <img
                      src={imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Thread / Primo Commento Connesso */}
            {includeThread && (
              <div className="relative pl-4 pt-1 border-l-2 border-gray-200 ml-4.5 space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#26050a] flex items-center justify-center p-1 shrink-0 border border-[#f0b516]/60">
                    <WolfLogo className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-extrabold text-gray-900">RomaFlash</span>
                      <span className="text-gray-400 text-[10px]">In risposta a @romaflashoffici</span>
                    </div>
                    <div className="text-[11px] text-gray-700 font-mono mt-0.5 whitespace-pre-wrap bg-white p-2 rounded-xl border border-gray-200">
                      {threadComment}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Toggle e Configurazione Thread */}
          <div className="p-3 rounded-2xl border border-gray-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-gray-800">
                <input
                  type="checkbox"
                  checked={includeThread}
                  onChange={(e) => setIncludeThread(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black h-4 w-4"
                />
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Invia Primo Commento Automatico (Thread)
                </span>
              </label>
              <span className="text-[10px] text-gray-400 font-mono">Anti-Penalizzazione Algoritmo</span>
            </div>

            {includeThread && (
              <textarea
                rows={2}
                value={threadComment}
                onChange={(e) => setThreadComment(e.target.value)}
                placeholder="Testo del primo commento..."
                className="w-full text-xs font-mono p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-black text-gray-800 bg-gray-50/50"
              />
            )}
          </div>
        </div>

        {/* Footer con Azioni */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || isTooLong || !tweetText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 active:scale-95 text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPublishing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Invio a Buffer in corso...
              </>
            ) : (
              <>
                <XLogoIcon className="w-3.5 h-3.5 text-white" />
                {isAlreadyPublished ? "Ripubblica su 𝕏" : "Pubblica ora su 𝕏"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
