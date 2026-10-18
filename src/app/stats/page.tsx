"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import GlobalHeader from "@/components/GlobalHeader";
import TikTokKitModal, { TikTokIcon } from "@/components/TikTokKitModal";
import InstagramStoryModal, { InstagramIcon } from "@/components/InstagramStoryModal";
import AnalistaStatsModal from "@/components/AnalistaStatsModal";
import XPublishModal, { XLogoIcon } from "@/components/XPublishModal";
import {
  Eye,
  Flame,
  Snowflake,
  Clock,
  BarChart3,
  Trash2,
  RefreshCw,
  Lock,
  LogOut,
  ExternalLink,
  FileText,
  Vote,
  TrendingUp,
  ThumbsUp,
  Send,
} from "lucide-react";

const ADMIN_PIN = "1927";
const STORAGE_PIN_KEY = "romaflash_admin_unlocked_pin";

type SortMode =
  | "recent"
  | "most_read"
  | "least_read"
  | "most_liked"
  | "most_voted"
  | "not_on_x"
  | "on_x";

export default function StatsBackofficePage() {
  const [pinInput, setPinInput] = useState("");
  const [unlockedPin, setUnlockedPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [articles, setArticles] = useState<any[]>([]);
  const [pollVotesMap, setPollVotesMap] = useState<Record<string, number>>({});
  const [reactionsMap, setReactionsMap] = useState<Record<string, { total: number; like: number; love: number }>>({});
  const [totalPollVotes, setTotalPollVotes] = useState(0);
  const [totalReactions, setTotalReactions] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tiktokArticle, setTiktokArticle] = useState<any | null>(null);
  const [instagramArticle, setInstagramArticle] = useState<any | null>(null);
  const [analystArticle, setAnalystArticle] = useState<any | null>(null);
  const [xArticle, setXArticle] = useState<any | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PIN_KEY);
      if (saved === ADMIN_PIN) {
        setUnlockedPin(saved);
      }
    } catch {
      // ignore
    }
    setCheckingAuth(false);
  }, []);

  const fetchBackofficeData = async () => {
    setLoadingData(true);
    try {
      const [articlesRes, votesRes, reactionsRes] = await Promise.all([
        supabase
          .from("articles")
          .select("id, title, published_at, views, image_url, original_url, ai_summary, sources(name)")
          .order("published_at", { ascending: false })
          .limit(200),
        supabase.from("poll_votes").select("article_id"),
        supabase.from("article_reactions").select("article_id, reaction_type"),
      ]);

      if (articlesRes.data) {
        setArticles(articlesRes.data);
      }

      if (votesRes.data) {
        const counts: Record<string, number> = {};
        for (const v of votesRes.data) {
          counts[v.article_id] = (counts[v.article_id] || 0) + 1;
        }
        setPollVotesMap(counts);
        setTotalPollVotes(votesRes.data.length);
      }

      if (reactionsRes.data) {
        const counts: Record<string, { total: number; like: number; love: number }> = {};
        for (const r of reactionsRes.data) {
          if (!counts[r.article_id]) {
            counts[r.article_id] = { total: 0, like: 0, love: 0 };
          }
          counts[r.article_id].total += 1;
          if (r.reaction_type === "like") counts[r.article_id].like += 1;
          else if (r.reaction_type === "love") counts[r.article_id].love += 1;
        }
        setReactionsMap(counts);
        setTotalReactions(reactionsRes.data.length);
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (unlockedPin === ADMIN_PIN) {
      fetchBackofficeData();
    }
  }, [unlockedPin]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setUnlockedPin(ADMIN_PIN);
      setPinError(false);
      try {
        localStorage.setItem(STORAGE_PIN_KEY, ADMIN_PIN);
      } catch {
        // ignore
      }
    } else {
      setPinError(true);
    }
  };

  const handleLock = () => {
    setUnlockedPin(null);
    setPinInput("");
    try {
      localStorage.removeItem(STORAGE_PIN_KEY);
    } catch {
      // ignore
    }
  };

  const handleDeleteArticle = async (articleId: string, title: string) => {
    if (!unlockedPin) return;
    const confirmed = window.confirm(
      `Vuoi eliminare definitivamente questo articolo?\n\n"${title}"`
    );
    if (!confirmed) return;

    setDeletingId(articleId);
    const { error } = await supabase.rpc("admin_delete_article", {
      target_article_id: articleId,
      admin_pin: unlockedPin,
    });

    if (error) {
      alert("Errore durante l'eliminazione: " + error.message);
    } else {
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    }
    setDeletingId(null);
  };

  const handleSetTikTokShared = async (articleId: string, shared: boolean) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? {
              ...a,
              ai_summary: { ...(a.ai_summary || {}), tiktok_shared: shared },
            }
          : a
      )
    );
    if (!unlockedPin) return;
    await supabase.rpc("admin_set_tiktok_shared", {
      target_article_id: articleId,
      admin_pin: unlockedPin,
      is_shared: shared,
    });
  };

  const handleSetInstagramShared = async (articleId: string, shared: boolean) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? {
              ...a,
              ai_summary: { ...(a.ai_summary || {}), instagram_shared: shared },
            }
          : a
      )
    );
    if (!unlockedPin) return;
    await supabase.rpc("admin_set_instagram_shared", {
      target_article_id: articleId,
      admin_pin: unlockedPin,
      is_shared: shared,
    });
  };

  const metrics = useMemo(() => {
    const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const articles24h = articles.filter(
      (a) => now - new Date(a.published_at).getTime() <= oneDayMs
    );
    const views24h = articles24h.reduce((sum, a) => sum + (a.views || 0), 0);
    const avgViews =
      articles.length > 0 ? (totalViews / articles.length).toFixed(1) : "0";

    // Raggruppamento per categoria
    const byCategory: Record<string, { count: number; views: number }> = {};
    for (const a of articles) {
      const cat = a.ai_summary?.category || "Altro";
      if (!byCategory[cat]) byCategory[cat] = { count: 0, views: 0 };
      byCategory[cat].count += 1;
      byCategory[cat].views += a.views || 0;
    }

    const categoryStats = Object.entries(byCategory)
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        views: stats.views,
        avg: stats.count > 0 ? +(stats.views / stats.count).toFixed(1) : 0,
      }))
      .sort((a, b) => b.views - a.views);

    return {
      totalViews,
      views24h,
      articlesCount: articles.length,
      articles24hCount: articles24h.length,
      avgViews,
      categoryStats,
    };
  }, [articles]);

  const sortedArticles = useMemo(() => {
    const copy = [...articles];
    if (sortMode === "most_read") {
      return copy.sort(
        (a, b) =>
          (b.views || 0) - (a.views || 0) ||
          new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
    }
    if (sortMode === "least_read") {
      return copy.sort(
        (a, b) =>
          (a.views || 0) - (b.views || 0) ||
          new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
    }
    if (sortMode === "most_liked") {
      return copy.sort(
        (a, b) =>
          ((reactionsMap[b.id]?.total) || 0) - ((reactionsMap[a.id]?.total) || 0) ||
          (b.views || 0) - (a.views || 0)
      );
    }
    if (sortMode === "most_voted") {
      return copy.sort(
        (a, b) =>
          (pollVotesMap[b.id] || 0) - (pollVotesMap[a.id] || 0) ||
          (b.views || 0) - (a.views || 0)
      );
    }
    if (sortMode === "not_on_x") {
      return copy
        .filter((a) => !a.ai_summary?.x_tweet_id)
        .sort(
          (a, b) =>
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        );
    }
    if (sortMode === "on_x") {
      return copy
        .filter((a) => Boolean(a.ai_summary?.x_tweet_id))
        .sort(
          (a, b) =>
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        );
    }
    return copy.sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }, [articles, sortMode, pollVotesMap, reactionsMap]);

  if (checkingAuth) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 lg:pb-12" />
    );
  }

  // SCHERMATA DI SBLOCCO PIN (Zero dati esposti nel DOM statico)
  if (unlockedPin !== ADMIN_PIN) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 lg:pb-12 flex flex-col">
        <GlobalHeader title="Backoffice" />
        <div className="flex-1 flex items-center justify-center py-16">
          <form
            onSubmit={handleUnlock}
            className="w-full max-w-sm bg-white border border-border rounded-2xl p-6 shadow-sm text-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              Backoffice RomaFlash
            </h1>
            <p className="text-xs text-gray-500 mb-5">
              Area privata non indicizzata. Inserisci il PIN per visualizzare le
              statistiche.
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="PIN di accesso"
              className="w-full px-4 py-2.5 text-center tracking-widest font-bold text-lg rounded-xl border border-border bg-gray-50 focus:bg-white focus:outline-none focus:border-primary mb-3"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-red-600 font-semibold mb-3">
                PIN errato. Riprova.
              </p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-95 transition-opacity cursor-pointer"
            >
              Sblocca Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 lg:pb-12">
      <GlobalHeader title="Backoffice" />

      {/* Header Backoffice */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Privato • No-Index
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Statistiche & Letture Articoli
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Monitoraggio in tempo reale degli articoli più e meno letti (ultimi{" "}
            {articles.length} articoli).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBackofficeData}
            disabled={loadingData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-gray-700 hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingData ? "animate-spin text-primary" : ""}`}
            />
            Aggiorna
          </button>
          <button
            type="button"
            onClick={handleLock}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
            title="Blocca sessione"
          >
            <LogOut className="w-3.5 h-3.5" />
            Blocca
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        <div className="bg-white border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
            <span>Letture Totali</span>
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-gray-900">
            {metrics.totalViews}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            +{metrics.views24h} nelle ultime 24h
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
            <span>Like & Reazioni</span>
            <ThumbsUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-gray-900">
            {totalReactions}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            reazioni totali tifosi
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
            <span>Voti Sondaggi</span>
            <Vote className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-gray-900">
            {totalPollVotes}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            interazioni totali ai poll
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
            <span>Media per Articolo</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-gray-900">
            {metrics.avgViews}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            letture / notizia
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
            <span>Articoli in DB</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-gray-900">
            {metrics.articlesCount}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {metrics.articles24hCount} nelle 24h
          </div>
        </div>
      </div>

      {/* Rendimento per Categoria */}
      <div className="bg-white border border-border rounded-2xl p-4 md:p-5 mb-6 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-primary" />
          Rendimento per Categoria
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {metrics.categoryStats.map((cat) => (
            <div
              key={cat.category}
              className="p-3 rounded-xl bg-gray-50 border border-border/60 flex flex-col justify-between"
            >
              <span className="text-xs font-bold text-gray-800 truncate">
                {cat.category}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-black text-primary">
                  {cat.views}{" "}
                  <span className="text-[10px] font-normal text-gray-500">
                    views
                  </span>
                </span>
                <span className="text-[10px] font-semibold text-gray-500">
                  {cat.count} art. (μ {cat.avg})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtri di ordinamento */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex overflow-x-auto gap-2 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSortMode("recent")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              sortMode === "recent"
                ? "bg-primary text-white shadow-xs"
                : "bg-white text-gray-600 border border-border hover:text-gray-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Più Recenti
          </button>

          <button
            type="button"
            onClick={() => setSortMode("most_read")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              sortMode === "most_read"
                ? "bg-primary text-white shadow-xs"
                : "bg-white text-gray-600 border border-border hover:text-gray-900"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Più Letti
          </button>

          <button
            type="button"
            onClick={() => setSortMode("least_read")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              sortMode === "least_read"
                ? "bg-primary text-white shadow-xs"
                : "bg-white text-gray-600 border border-border hover:text-gray-900"
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            Meno Letti
          </button>

          <button
            type="button"
            onClick={() => setSortMode("most_liked")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              sortMode === "most_liked"
                ? "bg-primary text-white shadow-xs"
                : "bg-white text-gray-600 border border-border hover:text-gray-900"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Più Like
          </button>

          <button
            type="button"
            onClick={() => setSortMode("most_voted")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              sortMode === "most_voted"
                ? "bg-primary text-white shadow-xs"
                : "bg-white text-gray-600 border border-border hover:text-gray-900"
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            Più Votati (Sondaggi)
          </button>

          <button
            type="button"
            onClick={() => setSortMode("not_on_x")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              sortMode === "not_on_x"
                ? "bg-black text-white shadow-xs"
                : "bg-white text-gray-600 border border-border hover:text-gray-900"
            }`}
          >
            <XLogoIcon className="w-3 h-3" />
            Da twittare ({articles.filter((a) => !a.ai_summary?.x_tweet_id).length})
          </button>

          <button
            type="button"
            onClick={() => setSortMode("on_x")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              sortMode === "on_x"
                ? "bg-black text-white shadow-xs"
                : "bg-white text-gray-600 border border-border hover:text-gray-900"
            }`}
          >
            <XLogoIcon className="w-3 h-3 text-sky-400" />
            Pubblicati su 𝕏 ({articles.filter((a) => Boolean(a.ai_summary?.x_tweet_id)).length})
          </button>
        </div>
      </div>

      {/* Lista Articoli Mobile/PWA (md:hidden) */}
      <div className="md:hidden space-y-2.5">
        {sortedArticles.map((art, idx) => {
          const views = art.views || 0;
          const votes = pollVotesMap[art.id] || 0;
          const likes = reactionsMap[art.id]?.total || 0;
          const category = art.ai_summary?.category || "Altro";
          const sourceName = art.sources?.name || "RomaFlash";
          const pubDate = new Date(art.published_at).toLocaleString("it-IT", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Rome",
          });

          return (
            <div
              key={art.id}
              className="bg-white border border-border rounded-xl p-3.5 shadow-xs flex flex-col gap-2"
            >
              {/* Riga Superiore: Posizione + Social + Categoria a sinistra | Letture + Like + Voti + Azioni a destra */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-black text-gray-400">
                    #{idx + 1}
                  </span>
                  {art.ai_summary?.x_tweet_id && (
                    art.ai_summary?.x_tweet_url ? (
                      <a
                        href={art.ai_summary.x_tweet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-5 h-5 rounded bg-black text-white text-[10px] font-black shrink-0 hover:opacity-80 transition-opacity"
                        title="Apri tweet su X"
                      >
                        𝕏
                      </a>
                    ) : (
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded bg-black/60 text-white text-[10px] font-black shrink-0 cursor-default"
                        title="Pubblicato su X (in elaborazione link)"
                      >
                        𝕏
                      </span>
                    )
                  )}
                  {art.ai_summary?.tiktok_shared && (
                    <a
                      href="https://www.tiktok.com/@romaflash4"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-5 h-5 rounded bg-black text-white shrink-0"
                      title="Pubblicato su TikTok (@romaflash4)"
                    >
                      <TikTokIcon className="w-3 h-3" />
                    </a>
                  )}
                  {art.ai_summary?.instagram_shared && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetInstagramShared(art.id, false);
                      }}
                      className="inline-flex items-center justify-center w-5 h-5 rounded bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      title="Pubblicato su Instagram (clicca per rimuovere il segno)"
                    >
                      <InstagramIcon className="w-3 h-3" />
                    </button>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700 truncate">
                    {category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-extrabold ${
                      views > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-gray-100 text-gray-500"
                    }`}
                    title="Letture uniche"
                  >
                    <Eye className="w-3 h-3" />
                    {views}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      likes > 0
                        ? "bg-blue-500/10 text-blue-700"
                        : "bg-gray-50 text-gray-400"
                    }`}
                    title="Like e reazioni"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {likes}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      votes > 0
                        ? "bg-green-500/10 text-green-700"
                        : "bg-gray-50 text-gray-400"
                    }`}
                    title="Voti sondaggio"
                  >
                    <Vote className="w-3 h-3" />
                    {votes}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setXArticle(art);
                    }}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer hover:scale-105 shadow-xs ${
                      art.ai_summary?.x_tweet_id
                        ? "bg-black text-white hover:bg-neutral-800"
                        : "bg-gray-100 text-gray-700 hover:bg-black hover:text-white border border-gray-200"
                    }`}
                    title={
                      art.ai_summary?.x_tweet_id
                        ? "Già pubblicato su 𝕏 (apri per dettagli o ripubblica)"
                        : "Pubblica su 𝕏 con Formula a 3 Blocchi e Thread"
                    }
                  >
                    <XLogoIcon className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setTiktokArticle(art)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      art.ai_summary?.poll || art.ai_summary?.is_daily_recap
                        ? "bg-black text-white hover:bg-gray-800 shadow-xs"
                        : "bg-gray-100 text-gray-700 hover:bg-black hover:text-white"
                    }`}
                    title="Genera Kit 2 Slide per TikTok"
                  >
                    <TikTokIcon className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInstagramArticle(art);
                      handleSetInstagramShared(art.id, true);
                    }}
                    className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:opacity-90 transition-all shadow-xs cursor-pointer hover:scale-105"
                    title="Genera Storia o Reel Instagram 9:16"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" />
                  </button>

                  {Boolean(art.title?.toLowerCase().includes("l'analista") || art.ai_summary?.category === "L'Analista") && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnalystArticle(art);
                      }}
                      className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer border border-amber-500/30 shadow-xs hover:scale-105"
                      title="Scheda Grafica Statistiche Match (L'Analista)"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteArticle(art.id, art.title)}
                    disabled={deletingId === art.id}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-600 active:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                    title="Elimina articolo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Titolo Articolo leggibile per intero (fino a 2 righe) */}
              <Link
                href={`/article?id=${art.id}`}
                className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 active:text-primary"
              >
                {art.title}
              </Link>

              {/* Riga Inferiore: Fonte e Orario */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-border/50">
                <span className="truncate">{sourceName}</span>
                <span className="shrink-0">{pubDate}</span>
              </div>
            </div>
          );
        })}

        {!loadingData && sortedArticles.length === 0 && (
          <div className="bg-white border border-border rounded-xl py-10 text-center text-gray-500 text-sm">
            Nessun articolo trovato.
          </div>
        )}
      </div>

      {/* Tabella Articoli Desktop (hidden md:block) */}
      <div className="hidden md:block bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-border text-[11px] font-bold uppercase text-gray-500">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-4">Articolo</th>
                <th className="py-3 px-3 text-center">Social</th>
                <th className="py-3 px-3 text-center">Categoria</th>
                <th className="py-3 px-3 text-center">Letture</th>
                <th className="py-3 px-3 text-center">Like</th>
                <th className="py-3 px-3 text-center">Voti Poll</th>
                <th className="py-3 px-3 text-right">Data</th>
                <th className="py-3 px-3 w-20 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedArticles.map((art, idx) => {
                const views = art.views || 0;
                const votes = pollVotesMap[art.id] || 0;
                const likes = reactionsMap[art.id]?.total || 0;
                const category = art.ai_summary?.category || "Altro";
                const sourceName = art.sources?.name || "RomaFlash";
                const hasX = Boolean(art.ai_summary?.x_tweet_id);
                const hasTikTok = Boolean(art.ai_summary?.tiktok_shared);
                const hasInstagram = Boolean(art.ai_summary?.instagram_shared);
                const pubDate = new Date(art.published_at).toLocaleString(
                  "it-IT",
                  {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Rome",
                  }
                );

                return (
                  <tr
                    key={art.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="py-3 px-3 text-center font-bold text-xs text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <Link
                        href={`/article?id=${art.id}`}
                        className="font-bold text-gray-900 hover:text-primary transition-colors line-clamp-1 inline-flex items-center gap-1.5"
                      >
                        <span>{art.title}</span>
                        <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                      </Link>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Fonte: {sourceName}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {hasX || hasTikTok || hasInstagram ? (
                        <div className="inline-flex items-center justify-center gap-1">
                          {hasX && (
                            <a
                              href="https://x.com/romaflashoffici"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-black text-white text-[11px] font-black hover:bg-gray-800 transition-colors"
                              title="Pubblicato su X (@romaflashoffici)"
                            >
                              𝕏
                            </a>
                          )}
                          {hasTikTok && (
                            <a
                              href="https://www.tiktok.com/@romaflash4"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-black text-white hover:bg-gray-800 transition-colors"
                              title="Pubblicato su TikTok (@romaflash4)"
                            >
                              <TikTokIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {hasInstagram && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetInstagramShared(art.id, false);
                              }}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:opacity-80 transition-opacity cursor-pointer shadow-2xs"
                              title="Pubblicato su Instagram (clicca per rimuovere il segno)"
                            >
                              <InstagramIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                        {category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          views > 0
                            ? "bg-primary/10 text-primary"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        {views}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          likes > 0
                            ? "bg-blue-500/10 text-blue-700"
                            : "text-gray-400"
                        }`}
                        title={likes > 0 ? `${likes} like e reazioni` : "Nessuna reazione"}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {likes}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          votes > 0
                            ? "bg-green-500/10 text-green-700"
                            : "text-gray-400"
                        }`}
                      >
                        {votes}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-gray-500 whitespace-nowrap">
                      {pubDate}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setXArticle(art);
                          }}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer hover:scale-105 shadow-xs ${
                            art.ai_summary?.x_tweet_id
                              ? "bg-black text-white hover:bg-neutral-800"
                              : "bg-gray-100 text-gray-700 hover:bg-black hover:text-white border border-gray-200"
                          }`}
                          title={
                            art.ai_summary?.x_tweet_id
                              ? "Già pubblicato su 𝕏 (apri per dettagli o ripubblica)"
                              : "Pubblica su 𝕏 con Formula a 3 Blocchi e Thread"
                          }
                        >
                          <XLogoIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTiktokArticle(art)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            art.ai_summary?.poll || art.ai_summary?.is_daily_recap
                              ? "bg-black text-white hover:bg-gray-800 shadow-xs"
                              : "bg-gray-100 text-gray-700 hover:bg-black hover:text-white"
                          }`}
                          title="Genera Kit 2 Slide per TikTok"
                        >
                          <TikTokIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInstagramArticle(art);
                            handleSetInstagramShared(art.id, true);
                          }}
                          className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:opacity-90 transition-all shadow-xs cursor-pointer hover:scale-105"
                          title="Genera Storia o Reel Instagram 9:16"
                        >
                          <InstagramIcon className="w-3.5 h-3.5" />
                        </button>
                        {Boolean(art.title?.toLowerCase().includes("l'analista") || art.ai_summary?.category === "L'Analista") && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnalystArticle(art);
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer border border-amber-500/30 shadow-2xs hover:scale-105"
                            title="Scheda Grafica Statistiche Match (L'Analista)"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(art.id, art.title)}
                          disabled={deletingId === art.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                          title="Elimina articolo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loadingData && sortedArticles.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-gray-500 text-sm"
                  >
                    Nessun articolo trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Generatore Kit TikTok 2 Slide (1080x1350) */}
      <TikTokKitModal
        article={tiktokArticle}
        onClose={() => setTiktokArticle(null)}
        onMarkShared={handleSetTikTokShared}
      />

      {/* Modal Generatore Storia Instagram 9:16 (1080x1920) */}
      <InstagramStoryModal
        article={instagramArticle}
        onClose={() => setInstagramArticle(null)}
        onMarkShared={handleSetInstagramShared}
      />

      {/* Modal Scheda Grafica Statistiche L'Analista */}
      <AnalistaStatsModal
        article={analystArticle}
        onClose={() => setAnalystArticle(null)}
      />

      {/* Modal Pubblicazione 𝕏 (Twitter) Buffer */}
      <XPublishModal
        article={xArticle}
        isOpen={Boolean(xArticle)}
        onClose={() => setXArticle(null)}
        onPublished={(updatedArt) => {
          setArticles((prev) =>
            prev.map((a) => (a.id === updatedArt.id ? updatedArt : a))
          );
        }}
      />
    </main>
  );
}
