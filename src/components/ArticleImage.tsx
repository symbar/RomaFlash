"use client";

import React, { useState } from 'react';
import { WolfLogo } from '@/components/Icons';

interface ArticleImageProps {
  src?: string | null;
  alt: string;
  variant?: 'hero' | 'card' | 'article';
  className?: string;
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

export default function ArticleImage({
  src,
  alt,
  variant = 'card',
  className = '',
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
    </div>
  );
}
