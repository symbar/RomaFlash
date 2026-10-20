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

// Fallback demo per anteprima via URL (?mvp_preview=1)
const DEMO_PREVIEW_POLL: MvpPollData = {
  id: 'demo-roma-genoa',
  match_title: 'Roma - Genoa',
  match_score: '2 - 0',
  status: 'active',
  started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  closes_at: new Date(Date.now() + 19 * 3600 * 1000).toISOString(),
  total_votes: 0,
  candidates: [
    {
      slug: 'castro',
      name: 'Santiago Castro',
      role: 'Attaccante',
      image: '/images/players/castro.png'
    },
    {
      slug: 'lulli',
      name: 'Emanuele Lulli',
      role: 'Esterno',
      image: '/images/players/lulli.png'
    },
    {
      slug: 'soule',
      name: 'Matías Soulé',
      role: 'Attaccante',
      image: '/images/players/soule.png'
    },
    {
      slug: 'balerdi',
      name: 'Leonardo Balerdi',
      role: 'Difensore',
      image: '/images/players/balerdi.png'
    }
  ]
};

const DEMO_VOTES_INITIAL: Record<string, number> = {
  castro: 0,
  lulli: 0,
  soule: 0,
  balerdi: 0
};

// Calcola la chiusura del sondaggio: fino alle ore 23:59:59 del giorno prima della partita successiva (fuso orario italiano)
function getPollCloseTimeBeforeNextMatch(nextMatchDateIso: string): number {
  const nextMatchDate = new Date(nextMatchDateIso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(nextMatchDate).split('-');

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  // Giorno prima della partita successiva
  const eveRef = new Date(Date.UTC(y, m - 1, d - 1, 12, 0, 0));
  const eveParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(eveRef).split('-');

  const eveY = eveParts[0];
  const eveM = eveParts[1];
  const eveD = eveParts[2];

  // Chiude alle ore 23:59:59 del giorno prima nel fuso orario di Roma (gestione automatica solare/legale)
  const utcGuess = new Date(`${eveY}-${eveM}-${eveD}T23:59:59Z`);
  const romeStr = utcGuess.toLocaleString('en-US', { timeZone: 'Europe/Rome' });
  const utcStr = utcGuess.toLocaleString('en-US', { timeZone: 'UTC' });
  const offsetMs = new Date(romeStr).getTime() - new Date(utcStr).getTime();

  return utcGuess.getTime() - offsetMs;
}

function getOrCreateVoterToken(): string {
  if (typeof window === 'undefined') return 'server';
  let token = localStorage.getItem('romaflash_voter_token');
  if (!token) {
    token = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'voter_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem('romaflash_voter_token', token);
  }
  return token;
}

export default function MvpPollWidget({ variant = 'auto' }: { variant?: 'mobile' | 'desktop' | 'auto' }) {
  const { t } = useLanguage();
  const [currentMatchInfo, setCurrentMatchInfo] = useState<{ id: number; matchKey: string; matchSlug: string } | null>(null);
  const [poll, setPoll] = useState<MvpPollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedSlug, setVotedSlug] = useState<string | null>(null);
  const [votesByPlayer, setVotesByPlayer] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Sincronizzazione immediata tra istanze concorrenti (mobile + desktop)
  useEffect(() => {
    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<{ pollId: string; slug: string }>;
      if (custom.detail?.slug) {
        setHasVoted(true);
        setVotedSlug(custom.detail.slug);
      }
    };
    window.addEventListener('romaflash_mvp_vote_recorded', handleSync);
    return () => window.removeEventListener('romaflash_mvp_vote_recorded', handleSync);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPoll() {
      try {
        const now = new Date();
        const nowIso = now.toISOString();

        // 1. Tenta la lettura da tabella dedicata match_mvp_polls (se migrata/presente)
        try {
          const { data, error } = await supabase
            .from('match_mvp_polls')
            .select('*')
            .eq('status', 'active')
            .lte('started_at', nowIso)
            .gt('closes_at', nowIso)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data && isMounted) {
            setPoll(data);
            setTotalVotes(data.total_votes || 0);

            const { data: statsData } = await supabase.rpc('get_mvp_poll_stats', { target_poll_id: data.id });
            if (statsData && statsData.votes_by_player) {
              setVotesByPlayer(statsData.votes_by_player);
              setTotalVotes(statsData.total_votes || 0);
            }

            const localVote = localStorage.getItem(`romaflash_mvp_voted_${data.id}`);
            if (localVote) {
              setHasVoted(true);
              setVotedSlug(localVote);
            }
            setLoading(false);
            return;
          }
        } catch {
          // Tabella match_mvp_polls non presente nel database remoto, procedi con rilevamento autonomo
        }

        // 2. RILEVAMENTO AUTONOMO DEL MATCH POST-PARTITA (Zero dipendenze da tabelle non migrate)
        // Recupera l'ultima partita giocata della Roma da calendar_matches
        const { data: matches } = await supabase
          .from('calendar_matches')
          .select('*')
          .or('home_team.eq.Roma,away_team.eq.Roma')
          .lte('match_date', nowIso)
          .order('match_date', { ascending: false })
          .limit(1);

        if (matches && matches.length > 0) {
          const match = matches[0];
          const matchTime = new Date(match.match_date).getTime();
          
          // Regola concordata:
          // Inizio sondaggio: 105 min di partita + 30 minuti dal fischio finale = 135 minuti dal calcio d'inizio
          const pollStart = matchTime + (105 + 30) * 60 * 1000;

          // Chiusura sondaggio: aperto fino alle 23:59:59 del giorno prima della partita successiva
          const { data: upcomingMatches } = await supabase
            .from('calendar_matches')
            .select('*')
            .or('home_team.eq.Roma,away_team.eq.Roma')
            .gt('match_date', match.match_date)
            .order('match_date', { ascending: true })
            .limit(1);

          const nextMatch = upcomingMatches?.[0];
          const pollCloses = nextMatch
            ? getPollCloseTimeBeforeNextMatch(nextMatch.match_date)
            : matchTime + 3 * 24 * 3600 * 1000;

          const nowTime = now.getTime();
          const isInsideVotingWindow = nowTime >= pollStart && nowTime <= pollCloses;
          const isPreview = typeof window !== 'undefined' && window.location.search.includes('mvp_preview=1');

          if (isInsideVotingWindow || isPreview) {
            const opponent = (match.home_team.toLowerCase() === 'roma' ? match.away_team : match.home_team).trim();
            const matchKey = `match_${match.id}`;
            const matchDateStr = match.match_date ? match.match_date.slice(0, 10) : '';
            const matchSlug = `${match.home_team}_${match.away_team}_${matchDateStr}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');

            if (isMounted) {
              setCurrentMatchInfo({
                id: match.id,
                matchKey,
                matchSlug
              });
            }

            // Cerca in modo STABILE l'articolo canonico per il sondaggio MVP della partita.
            // Priorità 1: L'articolo ufficiale "L'Analista" per questo avversario (ordinato ASC: il primo pubblicato, mai sovrascritto)
            let canonicalArticle: { id: string; title: string; published_at: string } | null = null;
            try {
              const { data: analystMatches } = await supabase
                .from('articles')
                .select('id, title, published_at')
                .gte('published_at', match.match_date)
                .ilike('title', "%Analista%")
                .ilike('title', `%${opponent}%`)
                .order('published_at', { ascending: true })
                .limit(1);

              if (analystMatches && analystMatches.length > 0) {
                canonicalArticle = analystMatches[0];
              }
            } catch {}

            // Priorità 2: Se non ancora pubblicato L'Analista, usa il primo articolo post-partita dell'avversario
            if (!canonicalArticle) {
              try {
                const { data: firstMatchArticles } = await supabase
                  .from('articles')
                  .select('id, title, published_at')
                  .gte('published_at', match.match_date)
                  .ilike('title', `%${opponent}%`)
                  .order('published_at', { ascending: true })
                  .limit(1);

                if (firstMatchArticles && firstMatchArticles.length > 0) {
                  canonicalArticle = firstMatchArticles[0];
                }
              } catch {}
            }

            const pollId = canonicalArticle?.id || `mvp-match-${match.id}`;

            // Determina il punteggio
            let score = match.score_home != null && match.score_away != null 
              ? `${match.score_home} - ${match.score_away}` 
              : undefined;

            if (!score && canonicalArticle?.title) {
              const sm = canonicalArticle.title.match(/\b(\d+)\s*[-–]\s*(\d+)\b/);
              if (sm) score = `${sm[1]} - ${sm[2]}`;
            }

            const isGenoaMatch = match.away_team.toLowerCase().includes('genoa') || match.home_team.toLowerCase().includes('genoa');
            const isSlovanMatch = match.away_team.toLowerCase().includes('slovan') || match.home_team.toLowerCase().includes('slovan') ||
                                  match.away_team.toLowerCase().includes('bratislava') || match.home_team.toLowerCase().includes('bratislava');

            if (!score && isGenoaMatch) {
              score = '2 - 0';
            }
            if (!score && isSlovanMatch) {
              score = '4 - 0';
            }

            const matchTitle = `${match.home_team} - ${match.away_team}`;

            // Configura i candidati ufficiali
            let candidates: MvpCandidate[] = [];

            if (isSlovanMatch) {
              // I 4 protagonisti di Roma - Slovan Bratislava: Hermoso, Molina, Malen, Balerdi
              candidates = [
                {
                  slug: 'hermoso',
                  name: 'Mario Hermoso',
                  role: 'Difensore',
                  image: '/images/players/hermoso.png'
                },
                {
                  slug: 'molina',
                  name: 'Nahuel Molina',
                  role: 'Esterno',
                  image: '/images/players/molina.png'
                },
                {
                  slug: 'malen',
                  name: 'Donyell Malen',
                  role: 'Attaccante',
                  image: '/images/players/malen.png'
                },
                {
                  slug: 'balerdi',
                  name: 'Leonardo Balerdi',
                  role: 'Difensore',
                  image: '/images/players/balerdi.png'
                }
              ];
            } else if (isGenoaMatch) {
              // I 4 protagonisti reali: Castro, Lulli, Soulé, Balerdi
              candidates = [
                {
                  slug: 'castro',
                  name: 'Santiago Castro',
                  role: 'Attaccante',
                  image: '/images/players/castro.png'
                },
                {
                  slug: 'lulli',
                  name: 'Emanuele Lulli',
                  role: 'Esterno',
                  image: '/images/players/lulli.png'
                },
                {
                  slug: 'soule',
                  name: 'Matías Soulé',
                  role: 'Attaccante',
                  image: '/images/players/soule.png'
                },
                {
                  slug: 'balerdi',
                  name: 'Leonardo Balerdi',
                  role: 'Difensore',
                  image: '/images/players/balerdi.png'
                }
              ];
            } else {
              // Fallback per future gare
              candidates = [
                {
                  slug: 'hermoso',
                  name: 'Mario Hermoso',
                  role: 'Difensore',
                  image: '/images/players/hermoso.png'
                },
                {
                  slug: 'molina',
                  name: 'Nahuel Molina',
                  role: 'Esterno',
                  image: '/images/players/molina.png'
                },
                {
                  slug: 'malen',
                  name: 'Donyell Malen',
                  role: 'Attaccante',
                  image: '/images/players/malen.png'
                },
                {
                  slug: 'balerdi',
                  name: 'Leonardo Balerdi',
                  role: 'Difensore',
                  image: '/images/players/balerdi.png'
                }
              ];
            }

            // Inizializza i voti per candidato
            const liveVotesBySlug: Record<string, number> = {};
            candidates.forEach(c => {
              liveVotesBySlug[c.slug] = 0;
            });
            let realVotesCount = 0;

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pollId);

            if (isUuid) {
              try {
                const { data: dbVotes } = await supabase
                  .from('poll_votes')
                  .select('option_index, voter_token')
                  .eq('article_id', pollId);

                if (dbVotes && dbVotes.length > 0) {
                  realVotesCount = dbVotes.length;
                  dbVotes.forEach(v => {
                    const c = candidates[v.option_index];
                    if (c) {
                      liveVotesBySlug[c.slug] = (liveVotesBySlug[c.slug] || 0) + 1;
                    }
                  });
                }
              } catch {
                // Non bloccare in caso di micro-disconnessione
              }
            }

            // CONTROLLO PERSISTENZA MULTI-LIVELLO DEL VOTO UTENTE
            const token = getOrCreateVoterToken();
            let resolvedVotedSlug: string | null = null;

            // 1. Verifica localStorage (chiave match ID, match slug, pollId, active_vote, prefisso storico)
            if (typeof window !== 'undefined') {
              const byMatch = localStorage.getItem(`romaflash_mvp_voted_${matchKey}`);
              const bySlug = localStorage.getItem(`romaflash_mvp_voted_${matchSlug}`);
              const byPoll = localStorage.getItem(`romaflash_mvp_voted_${pollId}`);

              if (byMatch && candidates.some(c => c.slug === byMatch)) {
                resolvedVotedSlug = byMatch;
              } else if (bySlug && candidates.some(c => c.slug === bySlug)) {
                resolvedVotedSlug = bySlug;
              } else if (byPoll && candidates.some(c => c.slug === byPoll)) {
                resolvedVotedSlug = byPoll;
              } else {
                try {
                  const raw = localStorage.getItem('romaflash_mvp_active_vote');
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if ((parsed.matchId === match.id || parsed.pollId === pollId) && parsed.slug) {
                      if (candidates.some(c => c.slug === parsed.slug)) {
                        resolvedVotedSlug = parsed.slug;
                      }
                    }
                  }
                } catch {}

                if (!resolvedVotedSlug) {
                  // Controlla qualsiasi chiave residua di voto
                  for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('romaflash_mvp_voted_')) {
                      const val = localStorage.getItem(k);
                      if (val && candidates.some(c => c.slug === val)) {
                        resolvedVotedSlug = val;
                        break;
                      }
                    }
                  }
                }
              }
            }

            // 2. Verifica su SERVER (Supabase poll_votes con voter_token)
            if (!resolvedVotedSlug && isUuid && token) {
              try {
                const { data: serverVote } = await supabase
                  .from('poll_votes')
                  .select('option_index')
                  .eq('article_id', pollId)
                  .eq('voter_token', token)
                  .maybeSingle();

                if (serverVote && serverVote.option_index != null) {
                  const cand = candidates[serverVote.option_index];
                  if (cand) {
                    resolvedVotedSlug = cand.slug;
                  }
                }
              } catch {}
            }

            // Se l'utente ha votato, garantisci la persistenza su tutte le chiavi canoniche
            if (resolvedVotedSlug && typeof window !== 'undefined') {
              try {
                localStorage.setItem(`romaflash_mvp_voted_${matchKey}`, resolvedVotedSlug);
                localStorage.setItem(`romaflash_mvp_voted_${matchSlug}`, resolvedVotedSlug);
                localStorage.setItem(`romaflash_mvp_voted_${pollId}`, resolvedVotedSlug);
                localStorage.setItem('romaflash_mvp_active_vote', JSON.stringify({
                  matchId: match.id,
                  matchTitle,
                  pollId,
                  slug: resolvedVotedSlug,
                  timestamp: Date.now()
                }));
              } catch {}
            }

            const activePoll: MvpPollData = {
              id: pollId,
              match_title: matchTitle,
              match_score: score,
              status: 'active',
              started_at: new Date(pollStart).toISOString(),
              closes_at: new Date(pollCloses).toISOString(),
              candidates,
              total_votes: realVotesCount
            };

            if (isMounted) {
              setPoll(activePoll);
              setVotesByPlayer(liveVotesBySlug);
              setTotalVotes(realVotesCount);

              if (resolvedVotedSlug) {
                setHasVoted(true);
                setVotedSlug(resolvedVotedSlug);
              }
              setLoading(false);
            }
            return;
          }
        }

        // Se non siamo nel range orario
        if (isMounted) {
          const isPreview = typeof window !== 'undefined' && window.location.search.includes('mvp_preview=1');
          if (isPreview) {
            setPoll(DEMO_PREVIEW_POLL);
            setVotesByPlayer(DEMO_VOTES_INITIAL);
            setTotalVotes(DEMO_PREVIEW_POLL.total_votes);
            const localVote = localStorage.getItem(`romaflash_mvp_voted_${DEMO_PREVIEW_POLL.id}`);
            if (localVote) {
              setHasVoted(true);
              setVotedSlug(localVote);
            }
          } else {
            setPoll(null);
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setPoll(null);
          setLoading(false);
        }
      }
    }

    loadPoll();

    return () => {
      isMounted = false;
    };
  }, []);

  // Timer rimanente per la chiusura del sondaggio
  useEffect(() => {
    if (!poll?.closes_at) return;

    function updateTimer() {
      const now = Date.now();
      const end = new Date(poll!.closes_at).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(t('mvp.closed'));
      } else {
        const totalHours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (totalHours >= 24) {
          const days = Math.floor(totalHours / 24);
          const remHours = totalHours % 24;
          setTimeLeft(`${days}g ${remHours}h`);
        } else {
          setTimeLeft(`${totalHours}h ${minutes}m`);
        }
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
    let maxVotes = 0;
    let topSlug: string | null = null;

    poll.candidates.forEach((c) => {
      const v = votesByPlayer[c.slug] || 0;
      if (v > maxVotes) {
        maxVotes = v;
        topSlug = c.slug;
      }
      percentages[c.slug] = totalVotes > 0 ? Math.round((v / totalVotes) * 100) : 0;
    });

    return { percentages, topSlug: maxVotes > 0 ? topSlug : null };
  }, [poll, votesByPlayer, totalVotes]);

  const handleVote = async (candidateSlug: string) => {
    if (!poll || hasVoted || isVoting) return;

    setIsVoting(true);
    const token = getOrCreateVoterToken();

    // Aggiornamento ottimistico immediato nell'interfaccia
    const newVotes = { ...votesByPlayer, [candidateSlug]: (votesByPlayer[candidateSlug] || 0) + 1 };
    const newTotal = totalVotes + 1;
    setVotesByPlayer(newVotes);
    setTotalVotes(newTotal);
    setHasVoted(true);
    setVotedSlug(candidateSlug);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`romaflash_mvp_voted_${poll.id}`, candidateSlug);
        if (currentMatchInfo) {
          localStorage.setItem(`romaflash_mvp_voted_${currentMatchInfo.matchKey}`, candidateSlug);
          localStorage.setItem(`romaflash_mvp_voted_${currentMatchInfo.matchSlug}`, candidateSlug);
          localStorage.setItem('romaflash_mvp_active_vote', JSON.stringify({
            matchId: currentMatchInfo.id,
            matchTitle: poll.match_title,
            pollId: poll.id,
            slug: candidateSlug,
            timestamp: Date.now()
          }));
        }

        // Notifica cross-istanza (per sincronizzare subito mobile & desktop)
        window.dispatchEvent(new CustomEvent('romaflash_mvp_vote_recorded', {
          detail: { pollId: poll.id, slug: candidateSlug }
        }));
      } catch {}
    }

    const candidateIndex = poll.candidates.findIndex(c => c.slug === candidateSlug);

    try {
      // Salva nel database Supabase su tabella esistente poll_votes se l'ID è un UUID articolo valido
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(poll.id);
      if (isUuid) {
        await supabase.from('poll_votes').insert({
          article_id: poll.id,
          option_index: candidateIndex >= 0 ? candidateIndex : 0,
          voter_token: token,
        });
      }

      // Prova anche RPC se presente
      await supabase.rpc('cast_mvp_vote', {
        target_poll_id: poll.id,
        target_player_slug: candidateSlug,
        target_voter_token: token
      });
    } catch {
      // Garantisce che il voto rimanga salvato e visibile all'utente anche in caso di eccezioni di rete
    } finally {
      setIsVoting(false);
    }
  };

  if (loading || !poll) return null;

  // Render Componente Desktop (Sidebar)
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

      <div className="text-[11px] text-gray-600 mb-3 px-0.5 flex items-center flex-wrap gap-1.5">
        <span>
          {t('mvp.subtitle_desktop')}{' '}
          <span className="font-bold text-gray-900">{poll.match_title}</span>
        </span>
        {poll.match_score && (
          <span className="text-[10px] font-black bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded border border-stone-200">
            {poll.match_score}
          </span>
        )}
      </div>

      {/* Lista 4 Candidati */}
      <div className="space-y-2.5">
        {poll.candidates.map((p) => {
          const isTop = stats.topSlug === p.slug;
          const isVotedThis = votedSlug === p.slug;
          const pct = stats.percentages[p.slug] || 0;

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

                  <div className="text-[10.5px] text-gray-500 font-medium">
                    {p.role}
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

  // Render Componente Mobile (Mini-Barra orizzontale compatta)
  const renderMobile = () => (
    <div className="bg-gradient-to-r from-[#fffdfa] via-white to-[#fffdfa] border border-[#fef08a] rounded-2xl p-3 shadow-xs mb-3.5 relative overflow-hidden">
      {/* Header compatto mobile: Titolo completo visibile e mai tagliato */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="text-xs">🏆</span>
          <span className="inline-block bg-[#b45309] text-white text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0">
            {t('mvp.badge')}
          </span>
          <span className="text-[10px] font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 shrink-0">
            {poll.match_title} {poll.match_score ? `${poll.match_score}` : ''}
          </span>
        </div>
        {timeLeft && (
          <span className="text-[10px] font-semibold text-[#92400e] bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md shrink-0">
            ⏱️ {timeLeft}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-[#78350f] leading-snug">
          {t('mvp.title')}
        </h3>
        {!hasVoted && (
          <span className="text-[9.5px] text-gray-400 font-medium shrink-0 ml-2">
            1 tap per votare
          </span>
        )}
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
