"use client";

import React, { useState } from 'react';
import { WolfLogo } from '@/components/Icons';

interface ArticleImageProps {
  src?: string | null;
  alt: string;
  variant?: 'hero' | 'thumbnail' | 'article';
  className?: string;
}

export default function ArticleImage({
  src,
  alt,
  variant = 'thumbnail',
  className = '',
}: ArticleImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) return null;

  if (variant === 'thumbnail') {
    return (
      <div
        className={`relative w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-border/70 ${className}`}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* RomaFlash Wolf Logo Badge (Top-Left) */}
        <div className="absolute top-1 left-1 w-5 h-5 rounded-md bg-[#2a070c]/85 backdrop-blur-xs flex items-center justify-center p-0.5 shadow-sm border border-[#f0b516]/40 pointer-events-none">
          <WolfLogo className="w-full h-full" />
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <img
          src={src}
          alt={alt}
          loading="eager"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
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
        src={src}
        alt={alt}
        loading="eager"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
      {/* RomaFlash Wolf Logo Badge (Top-Left) */}
      <div className="absolute top-3.5 left-3.5 z-10 w-9 h-9 rounded-xl bg-[#2a070c]/85 backdrop-blur-md flex items-center justify-center p-1.5 shadow-md border border-[#f0b516]/50 pointer-events-none">
        <WolfLogo className="w-full h-full" />
      </div>
    </div>
  );
}
