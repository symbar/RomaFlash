"use client";

import React, { useState } from 'react';
import { WolfLogo } from '@/components/Icons';

interface ArticleImageProps {
  src?: string | null;
  alt: string;
  variant?: 'hero' | 'card' | 'article';
  className?: string;
  article?: any;
}

const SERIE_A_LOGOS: Record<string, string> = {
  roma: 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
  fiorentina: 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png',
  como: 'https://a.espncdn.com/i/teamlogos/soccer/500/2572.png',
  juventus: 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
  milan: 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
  inter: 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  napoli: 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png',
  lazio: 'https://a.espncdn.com/i/teamlogos/soccer/500/112.png',
  atalanta: 'https://a.espncdn.com/i/teamlogos/soccer/500/122.png',
  bologna: 'https://a.espncdn.com/i/teamlogos/soccer/500/107.png',
  torino: 'https://a.espncdn.com/i/teamlogos/soccer/500/239.png',
  genoa: 'https://a.espncdn.com/i/teamlogos/soccer/500/3263.png',
  verona: 'https://a.espncdn.com/i/teamlogos/soccer/500/118.png',
  monza: 'https://a.espncdn.com/i/teamlogos/soccer/500/2729.png',
  udinese: 'https://a.espncdn.com/i/teamlogos/soccer/500/117.png',
  parma: 'https://a.espncdn.com/i/teamlogos/soccer/500/115.png',
  cagliari: 'https://a.espncdn.com/i/teamlogos/soccer/500/108.png',
  empoli: 'https://a.espncdn.com/i/teamlogos/soccer/500/1277.png',
  venezia: 'https://a.espncdn.com/i/teamlogos/soccer/500/2730.png',
  lecce: 'https://a.espncdn.com/i/teamlogos/soccer/500/113.png',
};

function getTeamLogo(teamName?: string): string | null {
  if (!teamName) return null;
  const name = teamName.toLowerCase().trim();
  for (const [key, logo] of Object.entries(SERIE_A_LOGOS)) {
    if (name.includes(key)) return logo;
  }
  return null;
}

interface MatchOverlayInfo {
  homeName: string;
  awayName: string;
  homeScore?: string;
  awayScore?: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
}

function resolveMatchInfo(article?: any): MatchOverlayInfo | null {
  if (!article) return null;

  // 1. From database match_info if present
  if (article.ai_summary?.match_info) {
    const mi = article.ai_summary.match_info;
    return {
      homeName: mi.home_name || 'Home',
      awayName: mi.away_name || 'Away',
      homeScore: mi.home_score !== undefined ? String(mi.home_score) : undefined,
      awayScore: mi.away_score !== undefined ? String(mi.away_score) : undefined,
      homeLogo: mi.home_logo || getTeamLogo(mi.home_name),
      awayLogo: mi.away_logo || getTeamLogo(mi.away_name),
    };
  }

  // 2. Parse from article title for L'Analista
  const title = article.title || '';
  const match = title.match(/(?:L'Analista|The Analyst)\s*\|\s*([^-–]+?)\s*[-–]\s*([^0-9:]+?)\s*(\d+)\s*[-–:]\s*(\d+)/i);
  if (match) {
    const homeName = match[1].trim();
    const awayName = match[2].trim();
    return {
      homeName,
      awayName,
      homeScore: match[3],
      awayScore: match[4],
      homeLogo: getTeamLogo(homeName),
      awayLogo: getTeamLogo(awayName),
    };
  }

  return null;
}

export function getArticleImageUrl(article: any): string | null {
  if (!article) return null;

  const isDailyBriefing =
    article.original_url?.startsWith('romaflash-daily-briefing') ||
    article.ai_summary?.category === 'Il Punto della Giornata' ||
    article.title?.startsWith('Il Punto della Giornata');

  const isAnalyst =
    article.original_url?.startsWith('romaflash-analyst') ||
    article.ai_summary?.category === "L'Analista" ||
    article.title?.startsWith("L'Analista");

  const idStr = String(article.id || article.original_url || article.title || '');
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) >>> 0;
  }

  if (isAnalyst) {
    if (article.image_url && article.image_url.includes('/analista/')) {
      return article.image_url;
    }
    return '/images/analista/lavagna-tattica.jpg';
  }

  if (isDailyBriefing) {
    const idx = (hash % 3) + 1;
    return `/images/daily-briefing/briefing-${idx}.jpg`;
  }

  if (article.image_url) {
    return article.image_url;
  }

  // Fallback to one of the 10 custom RomaFlash archive images only when image_url is missing
  const archiveIdx = (hash % 10) + 1;
  return `/images/archive/roma-${archiveIdx}.jpg`;
}

function AnalystMatchOverlay({
  info,
  variant,
}: {
  info: MatchOverlayInfo;
  variant: 'hero' | 'card' | 'article';
}) {
  const isCard = variant === 'card';
  const isHero = variant === 'hero';

  // Modalità Card Compatta (miniatura nella griglia/feed)
  if (isCard) {
    return (
      <>
        {/* Stemmi circolari sui due lati del campo (Home sinistra, Away destra) */}
        {info.homeLogo && (
          <div
            className="absolute left-[7%] sm:left-[9%] top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-xs shadow-lg border border-[#f0b516]/60 pointer-events-none w-8 h-8 sm:w-9 sm:h-9 p-1 sm:p-1.5 transition-transform duration-500 group-hover:scale-105"
            title={info.homeName}
          >
            <img
              src={info.homeLogo}
              alt={info.homeName}
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
        )}

        {info.awayLogo && (
          <div
            className="absolute right-[7%] sm:right-[9%] top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-xs shadow-lg border border-white/40 pointer-events-none w-8 h-8 sm:w-9 sm:h-9 p-1 sm:p-1.5 transition-transform duration-500 group-hover:scale-105"
            title={info.awayName}
          >
            <img
              src={info.awayLogo}
              alt={info.awayName}
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
        )}

        {/* Micro-Pillola Matchup in alto centrata */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0a120f]/90 backdrop-blur-xs border border-[#f0b516]/45 shadow-md whitespace-nowrap shrink-0">
            {info.homeLogo && (
              <img
                src={info.homeLogo}
                alt={info.homeName}
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
            )}
            <span className="text-white font-extrabold uppercase text-[10px] tracking-wide whitespace-nowrap shrink-0">
              {info.homeName.replace(/AS\s+/i, '')}
            </span>
            <span className="whitespace-nowrap shrink-0 inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-[#182620] text-[#f0b516] font-mono font-black text-[10px] leading-none border border-[#f0b516]/35 tracking-tight">
              {info.homeScore !== undefined && info.awayScore !== undefined ? (
                <span className="inline-block whitespace-nowrap select-none">
                  {info.homeScore}&#8209;{info.awayScore}
                </span>
              ) : (
                'VS'
              )}
            </span>
            <span className="text-white font-extrabold uppercase text-[10px] tracking-wide whitespace-nowrap shrink-0">
              {info.awayName.replace(/AS\s+/i, '')}
            </span>
            {info.awayLogo && (
              <img
                src={info.awayLogo}
                alt={info.awayName}
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
            )}
          </div>
        </div>
      </>
    );
  }

  // Modalità Hero (in evidenza) e Notizia interna
  return (
    <>
      {/* Pitch Team Crest Badges (Home half left, Away half right) */}
      {info.homeLogo && (
        <div
          className={`absolute left-[6%] sm:left-[9%] top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-xs shadow-2xl border border-[#f0b516]/65 pointer-events-none transition-transform duration-500 group-hover:scale-105 ${
            isHero ? 'w-12 h-12 sm:w-16 sm:h-16 p-2 sm:p-3' : 'w-14 h-14 sm:w-18 sm:h-18 p-2.5 sm:p-3.5'
          }`}
          title={info.homeName}
        >
          <img
            src={info.homeLogo}
            alt={info.homeName}
            className="w-full h-full object-contain filter drop-shadow"
          />
        </div>
      )}

      {info.awayLogo && (
        <div
          className={`absolute right-[6%] sm:right-[9%] top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-xs shadow-2xl border border-white/35 pointer-events-none transition-transform duration-500 group-hover:scale-105 ${
            isHero ? 'w-12 h-12 sm:w-16 sm:h-16 p-2 sm:p-3' : 'w-14 h-14 sm:w-18 sm:h-18 p-2.5 sm:p-3.5'
          }`}
          title={info.awayName}
        >
          <img
            src={info.awayLogo}
            alt={info.awayName}
            className="w-full h-full object-contain filter drop-shadow"
          />
        </div>
      )}

      {/* Floating Matchup HUD Banner */}
      <div
        className={`absolute z-20 pointer-events-none whitespace-nowrap ${
          isHero
            ? 'top-4 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2'
            : 'top-3.5 left-1/2 -translate-x-1/2'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#0a120f]/90 backdrop-blur-md border border-[#f0b516]/55 shadow-2xl whitespace-nowrap shrink-0">
          {info.homeLogo && (
            <img
              src={info.homeLogo}
              alt={info.homeName}
              className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0"
            />
          )}
          <span className="text-white font-black uppercase text-[10px] sm:text-xs tracking-wider whitespace-nowrap shrink-0">
            {info.homeName}
          </span>

          <span className="whitespace-nowrap shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#182620] text-[#f0b516] font-mono font-black text-xs sm:text-sm leading-none border border-[#f0b516]/40 shadow-xs tracking-tight">
            {info.homeScore !== undefined && info.awayScore !== undefined ? (
              <span className="inline-block whitespace-nowrap select-none">
                {info.homeScore}&#8209;{info.awayScore}
              </span>
            ) : (
              'VS'
            )}
          </span>

          <span className="text-white font-black uppercase text-[10px] sm:text-xs tracking-wider whitespace-nowrap shrink-0">
            {info.awayName}
          </span>
          {info.awayLogo && (
            <img
              src={info.awayLogo}
              alt={info.awayName}
              className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0"
            />
          )}
        </div>
      </div>
    </>
  );
}

export default function ArticleImage({
  src,
  alt,
  variant = 'card',
  className = '',
  article,
}: ArticleImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src || null);
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setImgSrc(src || null);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (imgSrc && imgSrc !== '/images/archive/roma-1.jpg') {
      setImgSrc('/images/archive/roma-1.jpg');
    } else {
      setHasError(true);
    }
  };

  if (!imgSrc || hasError) {
    if (variant === 'hero') {
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#2a070c] via-[#1a0407] to-gray-900 ${className}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 pointer-events-none" />
          <div className="absolute top-4 left-4 z-20 w-8 h-8 rounded-lg bg-[#2a070c]/85 backdrop-blur-sm flex items-center justify-center p-1.5 shadow-md border border-[#f0b516]/50 pointer-events-none">
            <WolfLogo className="w-full h-full" />
          </div>
        </div>
      );
    }
    return null;
  }

  const isExternal = imgSrc.startsWith('http://') || imgSrc.startsWith('https://');
  const isAnalyst = article
    ? (article.ai_summary?.category === "L'Analista" || article.title?.startsWith("L'Analista"))
    : (imgSrc.includes('/analista/'));
  const matchInfo = isAnalyst ? resolveMatchInfo(article) : null;

  if (variant === 'card') {
    return (
      <div
        className={`relative w-full aspect-[16/9] overflow-hidden bg-gray-100 border-b border-border/60 ${className}`}
      >
        <img
          src={imgSrc}
          alt={alt}
          loading="lazy"
          {...(isExternal ? { referrerPolicy: 'no-referrer' as const } : {})}
          onError={handleError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* RomaFlash Wolf Logo Badge (Top-Left) */}
        <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-lg bg-[#2a070c]/85 backdrop-blur-sm flex items-center justify-center p-1 shadow-md border border-[#f0b516]/50 pointer-events-none">
          <WolfLogo className="w-full h-full" />
        </div>

        {/* Dynamic Match Overlay (Logos + Score) */}
        {matchInfo && <AnalystMatchOverlay info={matchInfo} variant="card" />}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <img
          src={imgSrc}
          alt={alt}
          loading="eager"
          {...(isExternal ? { referrerPolicy: 'no-referrer' as const } : {})}
          onError={handleError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Gradient shadow for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 pointer-events-none" />
        {/* RomaFlash Wolf Logo Badge (Top-Left) */}
        <div className="absolute top-4 left-4 z-20 w-8 h-8 rounded-lg bg-[#2a070c]/85 backdrop-blur-sm flex items-center justify-center p-1.5 shadow-md border border-[#f0b516]/50 pointer-events-none">
          <WolfLogo className="w-full h-full" />
        </div>

        {/* Dynamic Match Overlay (Logos + Score) */}
        {matchInfo && <AnalystMatchOverlay info={matchInfo} variant="hero" />}
      </div>
    );
  }

  // variant === 'article' (Inside /article page)
  return (
    <div
      className={`relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden shadow-lg border border-border/80 bg-black/5 my-6 ${className}`}
    >
      <img
        src={imgSrc}
        alt={alt}
        loading="eager"
        {...(isExternal ? { referrerPolicy: 'no-referrer' as const } : {})}
        onError={handleError}
        className="w-full h-full object-cover"
      />
      {/* RomaFlash Wolf Logo Badge (Top-Left) */}
      <div className="absolute top-3.5 left-3.5 z-10 w-9 h-9 rounded-xl bg-[#2a070c]/85 backdrop-blur-md flex items-center justify-center p-1.5 shadow-md border border-[#f0b516]/50 pointer-events-none">
        <WolfLogo className="w-full h-full" />
      </div>

      {/* Dynamic Match Overlay (Logos + Score) */}
      {matchInfo && <AnalystMatchOverlay info={matchInfo} variant="article" />}
    </div>
  );
}
