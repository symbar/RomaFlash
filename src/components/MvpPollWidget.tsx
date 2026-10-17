"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/LanguageContext';

export interface MvpCandidate {
  slug: string;
  name: string;
  role: string;
  image: string;
  stat?: string;
}

export interface MvpPollData {
  id: string;
  match_title: string;
  match_score?: string;
  status: 'active' | 'closed';
  started_at: string;
  closes_at: string;
  candidates: MvpCandidate[];
  total_votes: number;
}

// Fallback pre-configurato con i 4 campioncini ufficiali reali scaricati
const DEFAULT_DEMO_POLL: MvpPollData = {
  id: 'demo-roma-fiorentina',
  match_title: 'Roma - Fiorentina',
  match_score: '2 - 1',
  status: 'active',
  started_at: new Date().toISOString(),
  closes_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
  total_votes: 3411,
  candidates: [
    {
      slug: 'dybala',
      name: 'Paulo Dybala',
      role: 'Attaccante',
      image: '/images/players/dybala.png',
      stat: 'Gol vittoria, 4 conclusioni, 3 dribbling riusciti'
    },
    {
      slug: 'kone',
      name: 'Manu Koné',
      role: 'Centrocampista',
      image: '/images/players/kone.png',
      stat: '11 palloni recuperati, 92% passaggi riusciti'
    },
    {
      slug: 'svilar',
      name: 'Mile Svilar',
      role: 'Portiere',
      image: '/images/players/svilar.png',
      stat: '4 parate decisive, miracolo sul finale al 92°'
    },
    {
      slug: 'malen',
      name: 'Donyell Malen',
      role: 'Attaccante',
      image: '/images/players/malen.png',
      stat: 'Gol del pareggio, grande intesa con Dybala'
    }
  ]
};

const DEMO_VOTES_INITIAL: Record<string, number> = {
  dybala: 1842,
  kone: 887,
  svilar: 443,
  malen: 239
};

function getOrCreateVoterToken(): string {
  if (typeof window === 'undefined') return 'server';
  let token = localStorage.getItem('romaflash_voter_token');
  if (!token) {
    token = 'voter_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem('romaflash_voter_token', token);
  }
  return token;
}

export default function MvpPollWidget({ variant = 'auto' }: { variant?: 'mobile' | 'desktop' | 'auto' }) {
  const { t } = useLanguage();
  const [poll, setPoll] = useState<MvpPollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedSlug, setVotedSlug] = useState<string | null>(null);
  const [votesByPlayer, setVotesByPlayer] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function loadPoll() {
      try {
        const nowIso = new Date().toISOString();
        // Cerca un sondaggio attivo su Supabase (tra started_at e closes_at)
        const { data, error } = await supabase
          .from('match_mvp_polls')
          .select('*')
          .eq('status', 'active')
          .lte('started_at', nowIso)
          .gt('closes_at', nowIso)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (isMounted) {
          if (data && !error) {
            setPoll(data);
            setTotalVotes(data.total_votes || 0);

            // Carica statistiche voti se disponibili
            const { data: statsData } = await supabase.rpc('get_mvp_poll_stats', { target_poll_id: data.id });
            if (statsData && statsData.votes_by_player) {
              setVotesByPlayer(statsData.votes_by_player);
              setTotalVotes(statsData.total_votes || 0);
            }

            // Verifica se l'utente ha già votato
            const localVote = localStorage.getItem(`romaflash_mvp_voted_${data.id}`);
            if (localVote) {
              setHasVoted(true);
              setVotedSlug(localVote);
            }
          } else {
            // Se non c'è nessun match terminato negli ultimi 30m-4h, verifica se è richiesta la preview di test via URL (?mvp_preview=1)
            const isPreview = typeof window !== 'undefined' && window.location.search.includes('mvp_preview=1');
            if (isPreview) {
              setPoll(DEFAULT_DEMO_POLL);
              setTotalVotes(DEFAULT_DEMO_POLL.total_votes);
              setVotesByPlayer(DEMO_VOTES_INITIAL);
              const localVote = localStorage.getItem(`romaflash_mvp_voted_${DEFAULT_DEMO_POLL.id}`);
              if (localVote) {
                setHasVoted(true);
                setVotedSlug(localVote);
              }
            } else {
              setPoll(null);
            }
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          const isPreview = typeof window !== 'undefined' && window.location.search.includes('mvp_preview=1');
          if (isPreview) {
            setPoll(DEFAULT_DEMO_POLL);
          } else {
            setPoll(null);
          }
          setLoading(false);
        }
      }
    }

    loadPoll();

    return () => {
      isMounted = false;
    };
  }, []);

  // Timer rimanente per la chiusura del sondaggio (4 ore)
  useEffect(() => {
    if (!poll?.closes_at) return;

    function updateTimer() {
      const now = Date.now();
      const end = new Date(poll!.closes_at).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(t('mvp.closed'));
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [poll, t]);

  // Calcolo statistiche & MVP in testa
  const stats = useMemo(() => {
    if (!poll?.candidates) return { percentages: {}, topSlug: null };

    const percentages: Record<string, number> = {};
    let maxVotes = -1;
    let topSlug: string | null = null;

    poll.candidates.forEach((c) => {
      const v = votesByPlayer[c.slug] || 0;
      if (v > maxVotes) {
        maxVotes = v;
        topSlug = c.slug;
      }
      percentages[c.slug] = totalVotes > 0 ? Math.round((v / totalVotes) * 100) : 0;
    });

    return { percentages, topSlug };
  }, [poll, votesByPlayer, totalVotes]);

  const handleVote = async (candidateSlug: string) => {
    if (!poll || hasVoted || isVoting) return;

    setIsVoting(true);
    const token = getOrCreateVoterToken();

    // Aggiornamento ottimistico immediato
    const newVotes = { ...votesByPlayer, [candidateSlug]: (votesByPlayer[candidateSlug] || 0) + 1 };
    const newTotal = totalVotes + 1;
    setVotesByPlayer(newVotes);
    setTotalVotes(newTotal);
    setHasVoted(true);
    setVotedSlug(candidateSlug);
    localStorage.setItem(`romaflash_mvp_voted_${poll.id}`, candidateSlug);

    // Salva sul database se presente
    try {
      await supabase.rpc('cast_mvp_vote', {
        target_poll_id: poll.id,
        target_player_slug: candidateSlug,
        target_voter_token: token
      });
    } catch {
      // Ignora errori di rete/schema per garantire esperienza continua
    } finally {
      setIsVoting(false);
    }
  };

  if (loading || !poll) return null;

  // Render Componente Desktop
  const renderDesktop = () => (
    <div className="bg-white border border-[#fef08a] rounded-2xl p-4 shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Intestazione dorata elegante */}
      <div className="bg-gradient-to-r from-[#fffbeb] to-[#fef3c7]/60 -mx-4 -mt-4 p-3.5 mb-3.5 border-b border-[#fef08a]/80 flex items-center justify-between">
        <div>
          <span className="inline-block bg-[#b45309] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
            {t('mvp.badge')}
          </span>
          <h3 className="text-sm font-bold text-[#78350f] leading-tight flex items-center gap-1.5">
            🏆 {t('mvp.title')}
          </h3>
        </div>
        {timeLeft && (
          <span className="text-[10px] font-semibold text-[#92400e] bg-white/80 px-2 py-0.5 rounded-md border border-[#fef08a]">
            ⏱️ {timeLeft}
          </span>
        )}
      </div>

      <div className="text-[11px] text-gray-500 mb-3 px-0.5">
        {t('mvp.subtitle_desktop')} <span className="font-bold text-gray-800">{poll.match_title}</span>
      </div>

      {/* Lista 4 Candidati */}
      <div className="space-y-2.5">
        {poll.candidates.map((p) => {
          const isTop = stats.topSlug === p.slug;
          const isVotedThis = votedSlug === p.slug;
          const pct = stats.percentages[p.slug] || 0;
          const count = votesByPlayer[p.slug] || 0;

          return (
            <div
              key={p.slug}
              className={`p-2 rounded-xl transition-all ${
                isTop && hasVoted
                  ? 'bg-amber-50/70 border-2 border-amber-400/80 shadow-xs'
                  : 'bg-stone-50 border border-stone-200/80 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {/* Avatar Campioncino Tondo Ufficiale */}
                <div className="relative shrink-0 w-11 h-11 rounded-full bg-[#26050a] border-2 border-[#f0b516] flex items-center justify-center overflow-hidden shadow-xs">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-contain transform scale-110 translate-y-1"
                    loading="lazy"
                  />
                  {isTop && hasVoted && (
                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                      👑
                    </div>
                  )}
                </div>

                {/* Dati Calciatore */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5">
                      <span className="truncate">{p.name}</span>
                      {isVotedThis && (
                        <span className="text-[9px] bg-green-100 text-green-800 font-bold px-1.5 py-0.2 rounded-sm shrink-0">
                          TU
                        </span>
                      )}
                    </div>
                    {hasVoted && (
                      <span className={`text-xs font-black ${isTop ? 'text-amber-700' : 'text-gray-800'}`}>
                        {pct}%
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-gray-500 font-medium truncate">
                    {p.role} {p.stat ? `• ${p.stat}` : ''}
                  </div>

                  {/* Barra Percentuale Animata dopo il voto */}
                  {hasVoted && (
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className={`h-full transition-all duration-700 rounded-full ${
                          isTop ? 'bg-amber-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Bottone VOTA (se non ha ancora votato) */}
                {!hasVoted && (
                  <button
                    onClick={() => handleVote(p.slug)}
                    disabled={isVoting}
                    className="px-3 py-1.5 rounded-full bg-[#26050a] hover:bg-[#3a0810] text-[#f0b516] text-[11px] font-bold tracking-tight shadow-xs transition-transform active:scale-95 shrink-0"
                  >
                    VOTA
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stato */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10.5px]">
        {hasVoted ? (
          <span className="text-green-700 font-bold flex items-center gap-1">
            ✔ {t('mvp.voted_success')}
          </span>
        ) : (
          <span className="text-gray-400 font-medium">
            1 voto a tifoso • Tap su VOTA
          </span>
        )}
        <span className="text-gray-500 font-mono text-[10px]">
          {totalVotes.toLocaleString('it-IT')} {t('mvp.total_votes')}
        </span>
      </div>
    </div>
  );

  // Render Componente Mobile (Mini-Barra orizzontale compatta, soli ~140px)
  const renderMobile = () => (
    <div className="bg-gradient-to-r from-[#fffdfa] via-white to-[#fffdfa] border border-[#fef08a] rounded-2xl p-3 shadow-xs mb-3.5 relative overflow-hidden">
      {/* Header compatto */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs">🏆</span>
          <h3 className="text-xs font-bold text-[#78350f] truncate leading-none">
            {t('mvp.title')}
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[#92400e] bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
          {hasVoted ? `⏱️ ${timeLeft}` : t('mvp.subtitle_mobile')}
        </span>
      </div>

      {/* 4 Avatars Orizzontali Affiancati */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {poll.candidates.map((p) => {
          const isTop = stats.topSlug === p.slug;
          const isVotedThis = votedSlug === p.slug;
          const pct = stats.percentages[p.slug] || 0;

          return (
            <button
              key={p.slug}
              onClick={() => handleVote(p.slug)}
              disabled={hasVoted || isVoting}
              className={`flex flex-col items-center text-center p-1 rounded-xl transition-transform active:scale-95 ${
                isTop && hasVoted ? 'bg-amber-50/80 ring-1 ring-amber-400' : 'hover:bg-gray-50'
              }`}
            >
              {/* Cerchio con Campioncino Ufficiale */}
              <div className="relative w-12 h-12 rounded-full bg-[#26050a] border-2 border-[#f0b516] flex items-center justify-center overflow-hidden shadow-xs mb-1">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-contain transform scale-110 translate-y-1"
                  loading="lazy"
                />
                {isTop && hasVoted && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    👑
                  </div>
                )}
                {isVotedThis && (
                  <div className="absolute bottom-0 inset-x-0 bg-green-600/90 text-white text-[7px] font-bold py-0.2">
                    TUO
                  </div>
                )}
              </div>

              {/* Nome compatto */}
              <span className="text-[10.5px] font-bold text-gray-900 truncate w-full leading-tight">
                {p.name.split(' ').pop()}
              </span>

              {/* Percentuale o invito al tap */}
              {hasVoted ? (
                <span className={`text-[10.5px] font-black mt-0.5 ${isTop ? 'text-amber-700' : 'text-gray-500'}`}>
                  {pct}%
                </span>
              ) : (
                <span className="text-[9px] text-[#8B0000] font-bold uppercase tracking-tight mt-0.5">
                  VOTA
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (variant === 'mobile') return renderMobile();
  if (variant === 'desktop') return renderDesktop();

  // Responsive auto-switch
  return (
    <>
      <div className="block lg:hidden">{renderMobile()}</div>
      <div className="hidden lg:block">{renderDesktop()}</div>
    </>
  );
}
