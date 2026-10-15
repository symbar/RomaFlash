"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

interface ReactionConfig {
  id: ReactionType;
  labelIt: string;
  labelEn: string;
  emoji: string;
}

export const FB_REACTIONS: ReactionConfig[] = [
  { id: 'like', labelIt: 'Mi piace', labelEn: 'Like', emoji: '👍' },
  { id: 'love', labelIt: 'Love', labelEn: 'Love', emoji: '❤️' },
  { id: 'haha', labelIt: 'Ahahah', labelEn: 'Haha', emoji: '😆' },
  { id: 'wow', labelIt: 'Wow', labelEn: 'Wow', emoji: '😮' },
  { id: 'sad', labelIt: 'Sigh', labelEn: 'Sad', emoji: '😢' },
  { id: 'angry', labelIt: 'Grrr', labelEn: 'Angry', emoji: '😡' },
];

interface ArticleReactionsProps {
  articleId: string;
}

export default function ArticleReactions({ articleId }: ArticleReactionsProps) {
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [counts, setCounts] = useState<{ [key in ReactionType]?: number } & { total?: number }>({});
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);
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
    // Se non ne ha nessuna -> assegna 'like' di default
    const nextReaction: ReactionType = userReaction ? userReaction : 'like';
    submitReaction(nextReaction);
  };

  // Invia reazione atomica a Supabase
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

  // Gestione touch mobile (Long press per aprire la dock delle reazioni)
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

  const totalReactions = counts.total || 0;

  // Render dell'icona del pulsante
  const renderButtonIcon = () => {
    if (!userReaction) {
      // Inactive: Outlined Thumb (Stile Screenshot 1)
      return (
        <svg
          className="w-5 h-5 text-gray-500 hover:text-gray-700 stroke-[1.8] fill-none stroke-current transition-colors"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
      );
    }

    if (userReaction === 'love') {
      // Active Love: Circular red gradient badge with white heart (Stile Screenshot 2)
      return (
        <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#f02849] to-[#ff5b79] flex items-center justify-center shadow-xs shrink-0 animate-scaleIn">
          <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </span>
      );
    }

    if (userReaction === 'like') {
      // Active Like: Circular blue badge with white thumb
      return (
        <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#1877F2] to-[#3b82f6] flex items-center justify-center shadow-xs shrink-0 animate-scaleIn">
          <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
            <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.22 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.33 20h8.13c.75 0 1.41-.41 1.75-1.03l2.62-5.09z" />
          </svg>
        </span>
      );
    }

    if (userReaction === 'haha') {
      return <span className="text-lg leading-none shrink-0 animate-scaleIn">😆</span>;
    }
    if (userReaction === 'wow') {
      return <span className="text-lg leading-none shrink-0 animate-scaleIn">😮</span>;
    }
    if (userReaction === 'sad') {
      return <span className="text-lg leading-none shrink-0 animate-scaleIn">😢</span>;
    }
    if (userReaction === 'angry') {
      return <span className="text-lg leading-none shrink-0 animate-scaleIn">😡</span>;
    }

    return null;
  };

  return (
    <div className="my-6 pt-4 border-t border-border/60 select-none">
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
                          {reaction.labelIt}
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
                      aria-label={reaction.labelIt}
                    >
                      {reaction.emoji}
                    </motion.button>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsante Compatto: Icona + Contatore Numerico (Stile Screenshot Utente) */}
        <button
          type="button"
          onClick={handleMainButtonClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200/80 transition-all cursor-pointer shadow-2xs select-none"
          title="Tieni premuto per altre reazioni"
          aria-label={userReaction ? `Reazione: ${userReaction}` : 'Mi piace'}
        >
          {renderButtonIcon()}
          <span className="text-sm font-semibold text-gray-700 tabular-nums">
            {totalReactions}
          </span>
        </button>
      </div>
    </div>
  );
}
