"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

interface ReactionConfig {
  id: ReactionType;
  labelIt: string;
  labelEn: string;
  emoji: string;
  activeColor: string;
  activeBg: string;
  badgeBg: string;
}

export const FB_REACTIONS: ReactionConfig[] = [
  {
    id: 'like',
    labelIt: 'Mi piace',
    labelEn: 'Like',
    emoji: '👍',
    activeColor: 'text-[#1877F2]',
    activeBg: 'bg-[#1877F2]/10',
    badgeBg: 'bg-[#1877F2]',
  },
  {
    id: 'love',
    labelIt: 'Love',
    labelEn: 'Love',
    emoji: '❤️',
    activeColor: 'text-[#E0245E]',
    activeBg: 'bg-[#E0245E]/10',
    badgeBg: 'bg-[#E0245E]',
  },
  {
    id: 'haha',
    labelIt: 'Ahahah',
    labelEn: 'Haha',
    emoji: '😆',
    activeColor: 'text-[#F59E0B]',
    activeBg: 'bg-[#F59E0B]/10',
    badgeBg: 'bg-[#F59E0B]',
  },
  {
    id: 'wow',
    labelIt: 'Wow',
    labelEn: 'Wow',
    emoji: '😮',
    activeColor: 'text-[#F59E0B]',
    activeBg: 'bg-[#F59E0B]/10',
    badgeBg: 'bg-[#F59E0B]',
  },
  {
    id: 'sad',
    labelIt: 'Sigh',
    labelEn: 'Sad',
    emoji: '😢',
    activeColor: 'text-[#F59E0B]',
    activeBg: 'bg-[#F59E0B]/10',
    badgeBg: 'bg-[#F59E0B]',
  },
  {
    id: 'angry',
    labelIt: 'Grrr',
    labelEn: 'Angry',
    emoji: '😡',
    activeColor: 'text-[#EF4444]',
    activeBg: 'bg-[#EF4444]/10',
    badgeBg: 'bg-[#EF4444]',
  },
];

interface ArticleReactionsProps {
  articleId: string;
}

export default function ArticleReactions({ articleId }: ArticleReactionsProps) {
  const { lang } = useLanguage();
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [counts, setCounts] = useState<{ [key in ReactionType]?: number } & { total?: number }>({});
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userTokenRef = useRef<string>('');

  // Ottieni o genera il token utente persistente
  useEffect(() => {
    try {
      let token = localStorage.getItem('romaflash_user_token');
      if (!token) {
        token = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('romaflash_user_token', token);
      }
      userTokenRef.current = token;
    } catch {
      userTokenRef.current = 'anon-user';
    }
  }, []);

  // Carica stato reazioni iniziale e sottoscrivi al Realtime
  useEffect(() => {
    let isMounted = true;

    async function loadReactions() {
      if (!articleId) return;
      const token = userTokenRef.current || (typeof window !== 'undefined' ? localStorage.getItem('romaflash_user_token') || '' : '');

      try {
        const { data, error } = await supabase.rpc('get_article_reactions', {
          target_article_id: articleId,
          target_user_token: token,
        });

        if (!error && data && isMounted) {
          if (data.user_reaction) {
            setUserReaction(data.user_reaction as ReactionType);
          }
          if (data.counts) {
            setCounts(data.counts);
          }
        }
      } catch (err) {
        console.error('Errore nel caricamento delle reazioni:', err);
      }
    }

    loadReactions();

    // Sottoscrizione Realtime
    const channel = supabase
      .channel(`article_reactions_${articleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_reactions',
          filter: `article_id=eq.${articleId}`,
        },
        () => {
          // Ricarica i conteggi quando cambia una reazione
          loadReactions();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [articleId]);

  // Gestione click rapido sul pulsante Like principale
  const handleMainButtonClick = () => {
    if (isDockOpen) {
      setIsDockOpen(false);
    }
    // Se l'utente ha già una reazione -> la rimuove (toggle off)
    // Se non ne ha nessuna -> mette 'like' di default
    const nextReaction: ReactionType = userReaction ? userReaction : 'like';
    submitReaction(nextReaction);
  };

  // Invia reazione
  const submitReaction = async (type: ReactionType) => {
    if (isSubmitting || !articleId) return;
    setIsSubmitting(true);
    setIsDockOpen(false);

    const prevReaction = userReaction;
    const prevCounts = { ...counts };

    // Calcolo ottimistico
    const isTogglingOff = prevReaction === type;
    const optimisticUserReaction = isTogglingOff ? null : type;

    const newCounts: any = { ...prevCounts };
    if (isTogglingOff) {
      newCounts[type] = Math.max(0, (newCounts[type] || 1) - 1);
      newCounts.total = Math.max(0, (newCounts.total || 1) - 1);
    } else {
      if (prevReaction) {
        newCounts[prevReaction] = Math.max(0, (newCounts[prevReaction] || 1) - 1);
      } else {
        newCounts.total = (newCounts.total || 0) + 1;
      }
      newCounts[type] = (newCounts[type] || 0) + 1;
    }

    setUserReaction(optimisticUserReaction);
    setCounts(newCounts);

    try {
      const token = userTokenRef.current || (typeof window !== 'undefined' ? localStorage.getItem('romaflash_user_token') || '' : '');
      const { data, error } = await supabase.rpc('toggle_article_reaction', {
        target_article_id: articleId,
        target_user_token: token,
        target_reaction_type: type,
      });

      if (error) {
        // Rollback
        setUserReaction(prevReaction);
        setCounts(prevCounts);
      } else if (data) {
        setUserReaction(data.user_reaction as ReactionType | null);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch {
      setUserReaction(prevReaction);
      setCounts(prevCounts);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestione hover desktop
  const handleMouseEnterContainer = () => {
    if (dockTimeoutRef.current) clearTimeout(dockTimeoutRef.current);
    dockTimeoutRef.current = setTimeout(() => {
      setIsDockOpen(true);
    }, 250);
  };

  const handleMouseLeaveContainer = () => {
    if (dockTimeoutRef.current) clearTimeout(dockTimeoutRef.current);
    dockTimeoutRef.current = setTimeout(() => {
      setIsDockOpen(false);
      setHoveredReaction(null);
    }, 300);
  };

  // Gestione touch mobile (Long press)
  const handleTouchStart = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(25);
        } catch {}
      }
      setIsDockOpen(true);
    }, 350);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  // Identifica reazione attiva
  const currentReactionConfig = userReaction
    ? FB_REACTIONS.find((r) => r.id === userReaction)
    : null;

  // Reazioni con almeno 1 voto per visualizzare le icone aggregate
  const activeReactionBreakdown = FB_REACTIONS.filter(
    (r) => (counts[r.id] || 0) > 0
  ).sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));

  const totalReactions = counts.total || 0;

  return (
    <div className="my-6 pt-4 border-t border-border/60 select-none">
      {/* Header / Summary row: Top reaction badges and count */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3 px-1">
        <div className="flex items-center gap-1.5">
          {totalReactions > 0 ? (
            <button
              type="button"
              onClick={() => setShowBreakdown((prev) => !prev)}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer group"
              title={lang === 'it' ? 'Vedi dettaglio reazioni' : 'View reactions breakdown'}
            >
              {/* Overlapping emoji circles style Facebook */}
              <div className="flex -space-x-1.5 items-center">
                {activeReactionBreakdown.slice(0, 3).map((r, idx) => (
                  <span
                    key={r.id}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-xs border border-white z-[${
                      10 - idx
                    }] bg-gray-50`}
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>
              <span className="font-semibold text-gray-700 group-hover:underline">
                {totalReactions} {totalReactions === 1 ? (lang === 'it' ? 'reazione' : 'reaction') : (lang === 'it' ? 'reazioni' : 'reactions')}
              </span>
            </button>
          ) : (
            <span className="text-gray-400 italic">
              {lang === 'it' ? 'Sii il primo a reagire!' : 'Be the first to react!'}
            </span>
          )}
        </div>

        {/* Breakdown modal/popover tooltip se cliccato */}
        {showBreakdown && totalReactions > 0 && (
          <div className="flex items-center gap-2 bg-gray-100 px-2.5 py-1 rounded-full text-[11px] font-medium text-gray-600 animate-fadeIn">
            {activeReactionBreakdown.map((r) => (
              <span key={r.id} className="flex items-center gap-0.5">
                <span>{r.emoji}</span>
                <span className="font-bold">{counts[r.id]}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pulsante principale stile Facebook con Dock fluttuante */}
      <div
        className="relative inline-block"
        onMouseEnter={handleMouseEnterContainer}
        onMouseLeave={handleMouseLeaveContainer}
      >
        {/* Floating Facebook Reactions Dock */}
        <AnimatePresence>
          {isDockOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 6 }}
              transition={{ type: 'spring', damping: 20, stiffness: 350 }}
              className="absolute bottom-full left-0 mb-2 z-50 flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-gray-200/80"
              style={{
                boxShadow: '0 8px 30px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              {FB_REACTIONS.map((reaction) => {
                const isSelected = userReaction === reaction.id;
                const isHovered = hoveredReaction === reaction.id;

                return (
                  <div
                    key={reaction.id}
                    className="relative flex flex-col items-center"
                    onMouseEnter={() => setHoveredReaction(reaction.id)}
                    onMouseLeave={() => setHoveredReaction(null)}
                  >
                    {/* Tooltip con nome della reazione */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 2, scale: 0.8 }}
                          transition={{ duration: 0.12 }}
                          className="absolute -top-7 px-2 py-0.5 rounded-full bg-gray-900/90 text-white text-[10px] font-bold tracking-tight pointer-events-none whitespace-nowrap shadow-sm"
                        >
                          {lang === 'it' ? reaction.labelIt : reaction.labelEn}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bottone Emoji con animazione spring scale */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.35, y: -4 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 15 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        submitReaction(reaction.id);
                      }}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-2xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-100 ring-2 ring-primary/40' : 'hover:bg-gray-100'
                      }`}
                      aria-label={lang === 'it' ? reaction.labelIt : reaction.labelEn}
                    >
                      {reaction.emoji}
                    </motion.button>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsante Like stile Facebook */}
        <button
          type="button"
          onClick={handleMainButtonClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-150 cursor-pointer border ${
            currentReactionConfig
              ? `${currentReactionConfig.activeBg} ${currentReactionConfig.activeColor} border-transparent shadow-xs`
              : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 border-gray-200/60'
          }`}
          aria-label={
            currentReactionConfig
              ? (lang === 'it' ? currentReactionConfig.labelIt : currentReactionConfig.labelEn)
              : (lang === 'it' ? 'Mi piace' : 'Like')
          }
        >
          {currentReactionConfig ? (
            <>
              <span className="text-lg leading-none transform transition-transform duration-150 scale-110">
                {currentReactionConfig.emoji}
              </span>
              <span className="font-bold tracking-tight">
                {lang === 'it' ? currentReactionConfig.labelIt : currentReactionConfig.labelEn}
              </span>
            </>
          ) : (
            <>
              <ThumbsUp className="w-4 h-4 text-gray-600 transition-colors" />
              <span className="tracking-tight">
                {lang === 'it' ? 'Mi piace' : 'Like'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
