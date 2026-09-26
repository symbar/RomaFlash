'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  const MAX_PULL = 100;
  const THRESHOLD = 70;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === 0 || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      if (distance > 0 && window.scrollY === 0) {
        // Prevent default scrolling when pulling down
        if (e.cancelable) e.preventDefault();
        setPullDistance(Math.min(distance * 0.5, MAX_PULL));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(THRESHOLD); // Hold position
        await onRefresh();
        setIsRefreshing(false);
      }
      setPullDistance(0);
      startY.current = 0;
      currentY.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-screen">
      {/* Indicatore di Refresh */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden transition-all duration-200"
        style={{ 
          height: `${pullDistance}px`,
          opacity: pullDistance / MAX_PULL
        }}
      >
        <div className="bg-card border border-border rounded-full p-2 shadow-lg flex items-center justify-center">
          <RefreshCw 
            className={`w-6 h-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      </div>

      {/* Contenuto della pagina che "scende" */}
      <div 
        className="transition-transform duration-200 ease-out h-full"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
