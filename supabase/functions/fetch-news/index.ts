import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import Parser from "https://esm.sh/rss-parser@3.13.0"
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function resolvePublicImageUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null
  if (rawUrl.startsWith('/')) {
    return `https://romaflash.app${rawUrl}`
  }
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&output=jpg`
  }
  return null
}

function generateArticleSlug(title: string, id: string): string {
  const cleanTitle = (title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 75);
  return cleanTitle ? `${cleanTitle}-${id}` : id;
}

async function postToX(
  tweetText: string,
  imageUrl?: string | null,
  threadCommentText?: string | null
): Promise<{ id?: string; url?: string; error?: string }> {
  const bufferApiKey = Deno.env.get('BUFFER_API_KEY')
  const bufferChannelId = Deno.env.get('BUFFER_CHANNEL_ID') || '6acbee4e778b240e2fdc27e7'

  if (!bufferApiKey) {
    return { error: 'BUFFER_API_KEY non configurata su Supabase' }
  }

  const publicImageUrl = resolvePublicImageUrl(imageUrl)
  const rootAssets = publicImageUrl ? [{ image: { url: publicImageUrl } }] : []

  // Regola Buffer per i Thread su Twitter/𝕏:
  // L'array metadata.twitter.thread[] è la fonte di verità:
  // - Elemento 0: root tweet (testo uguale al padre e relativi assets)
  // - Elemento 1: primo commento in risposta (thread con link, assets: [])
  const buildTwitterMetadata = (assets: any[]) => {
    if (!threadCommentText || !threadCommentText.trim()) return null
    return {
      twitter: {
        thread: [
          {
            text: tweetText,
            assets: assets,
          },
          {
            text: threadCommentText.trim(),
            assets: [],
          },
        ],
      },
    }
  }

  const mutation = `
    mutation CreatePost($text: String!, $channelId: ChannelId!, $assets: [AssetInput!]!, $metadata: PostInputMetaData) {
      createPost(
        input: {
          text: $text
          channelId: $channelId
          schedulingType: automatic
          mode: shareNow
          assets: $assets
          metadata: $metadata
        }
      ) {
        ... on PostActionSuccess {
          post {
            id
            text
            externalLink
          }
        }
        ... on MutationError {
          message
        }
      }
    }
  `

  // Tentativo 1: Con immagine (se disponibile) e thread
  try {
    const res = await fetch('https://api.buffer.com', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bufferApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          text: tweetText,
          channelId: bufferChannelId,
          assets: rootAssets,
          metadata: buildTwitterMetadata(rootAssets),
        },
      }),
    })

    const data = await res.json()
    const post = data?.data?.createPost?.post
    if (post?.id) {
      return { id: post.id, url: post.externalLink || undefined }
    }

    const errMsg = data?.data?.createPost?.message || JSON.stringify(data)
    console.warn('[X PUBLISH] Tentativo con immagine fallito, riprovo senza immagine:', errMsg)

    // Se il fallimento era dovuto all'immagine e avevamo un'immagine, riprova senza immagine ma con thread intatto
    if (rootAssets.length > 0) {
      const fallbackRes = await fetch('https://api.buffer.com', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bufferApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            text: tweetText,
            channelId: bufferChannelId,
            assets: [],
            metadata: buildTwitterMetadata([]),
          },
        }),
      })

      const fallbackData = await fallbackRes.json()
      const fallbackPost = fallbackData?.data?.createPost?.post
      if (fallbackPost?.id) {
        return { id: fallbackPost.id, url: fallbackPost.externalLink || undefined }
      }
      return { error: fallbackData?.data?.createPost?.message || JSON.stringify(fallbackData) }
    }

    return { error: errMsg }
  } catch (err: any) {
    console.error('Errore di rete verso Buffer:', err)
    return { error: err?.message || String(err) }
  }
}

serve(async (req) => {
  // Gestione CORS per poter testare la funzione anche dal frontend se serve
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Inizializza Supabase Client
    // Nelle Edge Functions, le variabili d'ambiente di Supabase sono già presenti
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Supporto ripubblicazione manuale o test di un articolo specifico su X in formato nativo
    let reqBody: any = null;
    try {
      if (req.method === 'POST') {
        reqBody = await req.json();
      }
    } catch {
      // Nessun body JSON fornito, prosegue con scraping normale
    }

    if (reqBody?.republishXArticleId) {
      const { data: art, error: artError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', reqBody.republishXArticleId)
        .single();

      if (artError || !art) {
        return new Response(JSON.stringify({ error: "Articolo non trovato", details: artError }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      const aiSummary = art.ai_summary || {};
      let fullTweet = '';

      if (reqBody.customTweetText && typeof reqBody.customTweetText === 'string' && reqBody.customTweetText.trim()) {
        fullTweet = reqBody.customTweetText.trim();
      } else {
        const cleanBase = (aiSummary.tweet_text || aiSummary.excerpt || art.title || '')
          .replace(/https?:\/\/\S+/gi, '')
          .replace(/#[a-zA-Z0-9_]+/g, '')
          .trim();
        const extraTags = (aiSummary.dynamic_hashtags || '')
          .replace(/#ASRoma/gi, '')
          .replace(/#RomaFlash/gi, '')
          .trim();
        const footer = `\n\n#ASRoma${extraTags ? ` ${extraTags}` : ''}`;
        
        const maxBaseLength = 278 - footer.length;
        let truncatedBase = cleanBase;
        if (cleanBase.length > maxBaseLength) {
          const lastSpace = cleanBase.lastIndexOf(' ', maxBaseLength - 3);
          truncatedBase = (lastSpace > 60 ? cleanBase.substring(0, lastSpace) : cleanBase.substring(0, maxBaseLength - 3)).trim() + '...';
        }
        fullTweet = `${truncatedBase}${footer}`;
      }

      // Preparazione primo commento / thread con il link all'articolo
      let threadComment: string | null = null;
      if (reqBody.customCommentText !== undefined) {
        threadComment = reqBody.customCommentText ? String(reqBody.customCommentText).trim() : null;
      } else if (reqBody.includeThreadComment !== false) {
        const articleSlug = generateArticleSlug(art.title, art.id);
        threadComment = `📖 Approfondimento completo e dati su RomaFlash:\nhttps://romaflash.app/notizie/${articleSlug}`;
      }

      console.log(`[X MANUAL PUBLISH] Invio tweet per articolo ${art.id}: "${fullTweet}" (Thread: "${threadComment}")`);
      const xRes = await postToX(fullTweet, art.image_url, threadComment);

      if (xRes.id) {
        aiSummary.x_tweet_id = xRes.id;
        if (xRes.url) aiSummary.x_tweet_url = xRes.url;
        aiSummary.x_posted_at = new Date().toISOString();
        if (reqBody.customTweetText) {
          aiSummary.tweet_text = reqBody.customTweetText.trim();
        }
        await supabase.from('articles').update({ ai_summary: aiSummary }).eq('id', art.id);
        return new Response(JSON.stringify({ success: true, tweetId: xRes.id, tweetUrl: xRes.url, fullTweet, threadComment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: xRes.error, fullTweet }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }

    if (reqBody?.restoreArticleImages && Array.isArray(reqBody.restoreArticleImages)) {
      let updated = 0;
      for (const item of reqBody.restoreArticleImages) {
        if (item.id && item.image_url) {
          const { error } = await supabase
            .from('articles')
            .update({ image_url: item.image_url })
            .eq('id', item.id);
          if (!error) updated++;
        }
      }
      return new Response(JSON.stringify({ success: true, updated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY non configurata")

    // Invocazione esclusiva di gemini-3.5-flash-lite con retry automatico in caso di temporaneo sovraccarico (503/429)
    const callGemini = async (requestParts: any[]): Promise<any> => {
      const modelName = 'gemini-3.5-flash-lite';
      let lastError: any = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: requestParts }],
                generationConfig: { temperature: 0.1 }
              }),
            }
          );

          if (resp.status === 200) {
            const data = await resp.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              return data;
            }
          }

          if (resp.status === 503 || resp.status === 429) {
            const errBody = await resp.text().catch(() => '');
            console.warn(`[GEMINI] ${modelName} temporaneamente occupato (HTTP ${resp.status}), tentativo ${attempt}/3... ${errBody.slice(0, 150)}`);
            // Se l'errore 429 è dovuto a esaurimento della quota giornaliera (RPD / Resource Exhausted), interrompi subito per non sprecare ulteriori tentativi
            if (resp.status === 429 && (errBody.includes('quota') || errBody.includes('RESOURCE_EXHAUSTED') || errBody.includes('PerDay') || errBody.includes('quota_exceeded'))) {
              throw new Error(`[GEMINI RPD LIMIT] Quota giornaliera RPD superata: ${errBody.slice(0, 150)}`);
            }
            if (attempt < 3) {
              await new Promise((r) => setTimeout(r, 1500));
              continue;
            }
          } else {
            const errBody = await resp.text().catch(() => '');
            console.warn(`[GEMINI] ${modelName} errore HTTP ${resp.status}: ${errBody.slice(0, 150)}`);
            break;
          }
        } catch (netErr) {
          lastError = netErr;
          console.warn(`[GEMINI] Errore di rete con ${modelName}:`, netErr);
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
        }
      }
      throw lastError || new Error("gemini-3.5-flash-lite non ha risposto correttamente dopo 3 tentativi");
    };

    // 2. Recupera le fonti RSS attive dal DB
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)

    if (sourcesError) throw sourcesError
    if (!sources || sources.length === 0) {
      return new Response(JSON.stringify({ message: "Nessuna fonte attiva trovata" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2b. Recupera i titoli e riassunti recenti per la deduplicazione e il conteggio tweet X (ultime 36 ore)
    const thirtySixHoursAgo = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
    const { data: recentArticles } = await supabase
      .from('articles')
      .select('title, ai_summary, published_at, image_url')
      .gte('published_at', thirtySixHoursAgo)
      .not('original_url', 'like', 'romaflash-daily-briefing-%')
      .order('published_at', { ascending: false });
      
    const eightHoursAgoMs = Date.now() - 8 * 60 * 60 * 1000;
    const usedImageUrls = new Set<string>(
      (recentArticles || [])
        .filter((a: any) => new Date(a.published_at).getTime() >= eightHoursAgoMs)
        .map((a: any) => a.image_url)
        .filter((u: any) => typeof u === 'string' && u.startsWith('http'))
    );

    const recentArchiveUsed = new Set<string>(
      (recentArticles || [])
        .slice(0, 15)
        .map((a: any) => a.image_url)
        .filter((u: any) => typeof u === 'string' && u.startsWith('/images/archive/'))
    );
      
    const latestPublishedAt = recentArticles && recentArticles.length > 0 
      ? new Date(recentArticles[0].published_at).getTime() 
      : 0;

    // Conteggio informativo dei tweet pubblicati oggi (fuso Europe/Rome)
    const getRomeDateStr = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(d);
    const todayRome = getRomeDateStr(new Date());

    let tweetsTodayCount = 0;
    let lastTweetTime = 0;
    if (recentArticles) {
      for (const art of recentArticles) {
        const postedAt = art.ai_summary?.x_posted_at;
        if (postedAt) {
          const t = new Date(postedAt).getTime();
          if (t > lastTweetTime) lastTweetTime = t;
          if (getRomeDateStr(new Date(postedAt)) === todayRome) {
            tweetsTodayCount++;
          }
        }
      }
    }
    console.log(`[X AUTO-POST] Tweet notizie già pubblicati oggi (${todayRome}): ${tweetsTodayCount}. Ultimo invio: ${lastTweetTime > 0 ? new Date(lastTweetTime).toISOString() : 'Nessuno'}`);

    const eligibleNewArticlesForX: Array<{
      id: string;
      title: string;
      image_url: string;
      ai_summary: any;
    }> = [];

    // Funzione deterministica anti-duplicato con stemming italiano e confronto incrociato Titolo + Riassunto
    const stopWords = new Set([
      'como', 'roma', 'real', 'madrid', 'milan', 'inter', 'juve', 'juventus', 'napoli', 'lazio',
      'giallorosso', 'giallorossi', 'giallorossa', 'giallorosse', 'trigoria', 'olimpico', 'stadio',
      'squadra', 'partita', 'sfida', 'match', 'campionato', 'serie', 'champions', 'league', 'europa',
      'stagione', 'calcio', 'calciatore', 'giocatore', 'giocatori', 'tecnico', 'allenatore', ' tifosi', 'tifoso',
      'della', 'delle', 'degli', 'dello', 'nella', 'nelle', 'negli', 'sulla', 'sulle', 'sugli',
      'contro', 'verso', 'prima', 'dopo', 'anche', 'sono', 'stato', 'stata', 'questo', 'questa',
      'quello', 'quella', 'tutto', 'tutti', 'tutte', 'molto', 'solo', 'fare', 'fatto', 'essere',
      'avere', 'hanno', 'alla', 'alle', 'agli', 'dalla', 'dalle', 'dagli', 'con', 'per', 'tra',
      'fra', 'che', 'non', 'piu', 'suo', 'sua', 'suoi', 'sue', 'loro', 'gli', 'una', 'uno',
      'dei', 'del', 'dal', 'nel', 'sul', 'col', 'oggi', 'ieri', 'domani', 'sempre', 'ancora',
      'nuovo', 'nuova', 'nuovi', 'nuove', 'grande', 'grandi', 'casa', 'parole', 'ultime', 'notizie'
    ]);

    const stemItalian = (word: string): string => {
      if (word.length <= 4) return word;
      return word
        .replace(/(zioni|zione|menti|mento)$/, 'z')
        .replace(/es$/, '')
        .replace(/[aeio]$/, '');
    };

    const extractTokens = (str: string): string[] => {
      return (str || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 4 && !stopWords.has(w))
        .map(stemItalian)
        .filter(w => w.length >= 3 && !stopWords.has(w));
    };

    interface ExistingArticleItem {
      title: string;
      fullText: string;
    }

    // Filtro deterministico anti-duplicato testuale:
    // Blocca esclusivamente dispacci d'agenzia identici o parafrasi evidenti dello stesso titolo (Jaccard >= 0.65 o 4+ parole identiche con alto overlap).
    // Evita falsi positivi tra notizie diverse sullo stesso match (es. formazioni, convocati, pagelle, interviste) delegando a Gemini il controllo semantico.
    const isArticleTooSimilar = (
      candidateTitle: string,
      _candidateExtra: string,
      existingItems: ExistingArticleItem[]
    ): string | null => {
      const candTokens = extractTokens(candidateTitle);
      const candTitleSet = new Set(candTokens);
      if (candTitleSet.size === 0) return null;

      for (const existing of existingItems) {
        const exTokens = extractTokens(existing.title);
        const exTitleSet = new Set(exTokens);
        if (exTitleSet.size === 0) continue;

        let intersection = 0;
        for (const t of candTokens) {
          if (exTitleSet.has(t)) intersection++;
        }

        const union = new Set([...candTitleSet, ...exTitleSet]).size;
        const jaccard = union > 0 ? intersection / union : 0;
        const minSize = Math.min(candTitleSet.size, exTitleSet.size);
        const overlapMin = minSize > 0 ? intersection / minSize : 0;

        // Criterio 1: Altissima sovrapposizione Jaccard (es. stesso dispaccio ANSA/Gazzetta su fonti diverse)
        if (jaccard >= 0.65 && intersection >= 3) {
          return existing.title;
        }

        // Criterio 2: Il titolo più corto è quasi interamente contenuto nell'altro (minimo 4 parole chiave)
        if (intersection >= 4 && overlapMin >= 0.8) {
          return existing.title;
        }

        // Criterio 3: Almeno 5 parole chiave identiche nel titolo
        if (intersection >= 5) {
          return existing.title;
        }
      }
      return null;
    };

    // Blacklist deterministica per bloccare contenuti autoreferenziali delle fonti:
    // Podcast VG, rubriche interne di VoceGiallorossa, rassegne interne, live Twitch, ecc.
    const isBlacklistedSourcePromo = (
      title: string,
      link: string,
      snippet?: string
    ): boolean => {
      // Testiamo i pattern promozionali solo su titolo e snippet, NON sul link (che contiene il dominio es. vocegiallorossa.it)
      const textOnly = `${title || ''} ${snippet || ''}`.toLowerCase();
      
      // 1. Riferimenti espliciti a podcast, TG o rubriche interne/autoreferenziali
      if (
        /\bpodcast\s*vg\b/i.test(textOnly) ||
        /\bvg\s*podcast\b/i.test(textOnly) ||
        /\btg\s+vg\b/i.test(textOnly) ||
        /\bvg\s+tg\b/i.test(textOnly) ||
        /\bvg\s+talk\b/i.test(textOnly) ||
        /\blive\s+vg\b/i.test(textOnly) ||
        /\bvg\s+live\b/i.test(textOnly) ||
        /\brassegna\s+stampa\s+vg\b/i.test(textOnly) ||
        /\brassegna\s+stampa\s+vocegiallorossa\b/i.test(textOnly) ||
        /\bla\s+voce\s+della\s+sera\b/i.test(textOnly)
      ) {
        return true;
      }

      // 2. URL della fonte categorizzati come podcast o rubriche di redazione interna
      const lowerLink = (link || '').toLowerCase();
      if (
        lowerLink.includes('/podcast/') ||
        lowerLink.includes('/la-voce-della-sera/') ||
        lowerLink.includes('/tg-vg/') ||
        lowerLink.includes('/vg-talk/')
      ) {
        return true;
      }

      // 3. Podcast e rubriche autoreferenziali di testata generici
      if (
        /\bnostro\s+podcast\b/i.test(textOnly) ||
        /\bi\s+nostri\s+podcast\b/i.test(textOnly) ||
        /\bpodcast\s+della\s+redazione\b/i.test(textOnly) ||
        /\bcanale\s+twitch\b/i.test(textOnly) ||
        /\bscarica\s+l['']app\s+di\b/i.test(textOnly)
      ) {
        return true;
      }

      return false;
    };

    const existingItemsArray: ExistingArticleItem[] = (recentArticles || []).map((a: any) => ({
      title: a.title,
      fullText: `${a.title} ${a.ai_summary?.excerpt || ''}`,
    }));

    let recentTitlesList = recentArticles && recentArticles.length > 0 
      ? recentArticles.map(a => `- ${a.title}${a.ai_summary?.excerpt ? ` (${a.ai_summary.excerpt})` : ''}`).join('\n')
      : "Nessun articolo recente."

    const parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'mediaContent', { keepArray: true }],
          ['enclosure', 'enclosure'],
          ['media:thumbnail', 'mediaThumbnail']
        ]
      }
    })
    let processedCount = 0
    const executionStartTime = Date.now()
    const MAX_EXECUTION_TIME_MS = 100_000 // 100s di guardia contro il timeout a 150s di Supabase
    const MAX_NEW_ARTICLES_PER_RUN = 2 // Massimo 2 nuovi articoli per singola esecuzione (garantisce pieno rispetto della quota free RPD di Gemini)

    // 3. Itera su ogni fonte
    let shouldHaltExecution = false
    for (const source of sources) {
      if (shouldHaltExecution) break
      console.log(`Analizzando fonte: ${source.name} (${source.rss_url})`)
      
      try {
        const feed = await parser.parseURL(source.rss_url)
        
        // Prendiamo i primi 2 articoli per fonte ad ogni giro (esattamente 2 articoli ogni 30 minuti come richiesto)
        const items = feed.items.slice(0, 2)

        for (const item of items) {
          if (processedCount >= MAX_NEW_ARTICLES_PER_RUN) {
            console.log(`[BATCH LIMIT] Raggiunto limite di ${MAX_NEW_ARTICLES_PER_RUN} nuovi articoli per questa esecuzione. Uscita pulita.`)
            shouldHaltExecution = true
            break
          }
          if (Date.now() - executionStartTime > MAX_EXECUTION_TIME_MS) {
            console.log(`[TIMEOUT GUARD] Tempo limite di 100s raggiunto (${Math.round((Date.now() - executionStartTime)/1000)}s). Uscita pulita.`)
            shouldHaltExecution = true
            break
          }

          if (!item.link || !item.title) continue;

          // Controllo blacklist deterministico anti-autopromozione / VG / podcast di testata
          if (isBlacklistedSourcePromo(item.title, item.link, item.contentSnippet || item.content)) {
            console.log(`[BLACK-LIST] Scartato articolo autoreferenziale/VG: "${item.title}" (${item.link})`);
            continue;
          }

          // Controlla se la notizia esiste già nel DB (duplicato esatto dell'URL)
          const { data: existing } = await supabase
            .from('articles')
            .select('id')
            .eq('original_url', item.link)
            .maybeSingle()

          if (existing) {
            console.log(`Saltata (già presente): ${item.title}`)
            continue
          }

          // Controllo deterministico preliminare sul titolo/snippet originale RSS contro gli articoli già pubblicati
          const matchedOriginalDup = isArticleTooSimilar(
            item.title,
            item.contentSnippet || '',
            existingItemsArray
          );
          if (matchedOriginalDup) {
            console.log(`DUPLICATO RILEVATO DAL FILTRO DETERMINISTICO (RSS): "${item.title}" ~ "${matchedOriginalDup}"`);
            continue;
          }

          console.log(`Nuova notizia trovata: ${item.title}`)

          // 3b. Estrazione preventiva immagine candidata (enclosure RSS, media:content, o og:image della pagina)
          let candidateImageUrl: string | null = null;
          if (item.enclosure?.url) {
            candidateImageUrl = item.enclosure.url;
          } else if ((item as any).mediaContent?.[0]?.$.url) {
            candidateImageUrl = (item as any).mediaContent[0].$.url;
          } else if ((item as any).mediaThumbnail?.$.url) {
            candidateImageUrl = (item as any).mediaThumbnail.$.url;
          }

          if (!candidateImageUrl && item.link) {
            try {
              const pageRes = await fetch(item.link, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                signal: AbortSignal.timeout(6000)
              });
              const pageHtml = await pageRes.text();
              const ogMatch = pageHtml.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                              pageHtml.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
              if (ogMatch && ogMatch[1]) {
                candidateImageUrl = ogMatch[1];
              }
            } catch {
              // fallback gracefully
            }
          }

          // Controllo preliminare: scarta solo se manca l'URL o se la stessa identica foto è già stata usata
          let isImageRejected =
            !candidateImageUrl ||
            usedImageUrls.has(candidateImageUrl);

          // Scarica i byte dell'immagine (tramite proxy ridimensionato wsrv.nl o diretto fino a 10MB) per farla ispezionare visivamente da Gemini Vision
          let inlineImagePart: any = null;
          if (candidateImageUrl && !isImageRejected) {
            try {
              const resizedUrl = `https://wsrv.nl/?url=${encodeURIComponent(candidateImageUrl)}&w=900&q=80&output=jpg`;
              let imgRes = await fetch(resizedUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                signal: AbortSignal.timeout(7000)
              }).catch(() => null);

              if (!imgRes || !imgRes.ok) {
                imgRes = await fetch(candidateImageUrl, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                  signal: AbortSignal.timeout(8000)
                });
              }

              if (imgRes && imgRes.ok) {
                const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
                const buf = await imgRes.arrayBuffer();
                if (buf.byteLength > 3000 && buf.byteLength < 10000000 && contentType.startsWith('image/')) {
                  const bytes = new Uint8Array(buf);
                  let binary = '';
                  const chunkSize = 0x8000;
                  for (let i = 0; i < bytes.length; i += chunkSize) {
                    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
                  }
                  inlineImagePart = {
                    inlineData: {
                      mimeType: contentType.split(';')[0].trim(),
                      data: btoa(binary)
                    }
                  };
                } else {
                  isImageRejected = true;
                }
              } else {
                isImageRejected = true;
              }
            } catch {
              isImageRejected = true;
            }
          }

          // 4. Chiama Gemini per il riassunto, controllo anti-spam e ispezione visiva dell'immagine
          const prompt = `Sei il caporedattore di RomaFlash, quotidiano sportivo sull'AS Roma. 
Il tuo compito è rielaborare questa notizia, ma PRIMA devi applicare un FILTRO ANTI-DUPLICATI E ANTI-SPAM ESTREMAMENTE RIGOROSO.

1) CONTROLLO DUPLICATI (FONDAMENTALE):
Verifica se la notizia che ti sto passando parla DELLO STESSO ARGOMENTO, EVENTO, INTERVISTA, CONVOCATI O PROBABILI FORMAZIONI di uno qualsiasi di questi articoli già pubblicati nelle ultime ore:
---
${recentTitlesList}
---
REGOLE TASSATIVE SUI DUPLICATI (imposta "is_duplicate": true in tutti questi casi):
- Se nella lista c'è già un articolo sui "Convocati" della partita e questo parla dei convocati -> È DUPLICATO (is_duplicate: true).
- Se nella lista c'è già un articolo sulle "Probabili formazioni / scelte dei quotidiani / ultime di formazione" per la stessa partita -> È DUPLICATO (is_duplicate: true).
- Se nella lista c'è già un'intervista o dichiarazione della stessa persona (es. Vierchowod, Capello, Fabregas, Gasperini, Tchouameni, Totti, Bove) sullo stesso tema -> È DUPLICATO (is_duplicate: true).
- Se due testate diverse riportano la stessa notizia, episodio, tributo, murale, evento, ospitata TV, libro, infortunio o designazione arbitrale usando sinonimi o angolazioni diverse (es. "Mourinho" vs "Special One", "murale" vs "murales") -> È DUPLICATO (is_duplicate: true).
Nel dubbio, imposta SEMPRE "is_duplicate": true!

2) SPAM / NOTIZIE NON PERTINENTI / PROMO DI ALTRE REDAZIONI (TASSATIVO):
- Verifica se la notizia parla effettivamente dell'AS Roma o dei suoi prossimi avversari. Se non c'entra nulla, imposta "is_spam" a true. ATTENZIONE: I post dai canali social ufficiali (AS Roma) NON SONO MAI SPAM.
- Scarta TASSATIVAMENTE (imposta "is_spam": true) podcast, rubriche promozionali interne, TG/talk redazionali o dirette Twitch di testate esterne (es. "Podcast VG", "VG Podcast", "TG VG", "La Voce della Sera", "Live Twitch").
- Se la notizia è un reale fatto di cronaca, campo o calciomercato ma cita fonti esterne o contiene sigle (come "VG" o "Vocegiallorossa"), NON scartarla se ha rilevanza informativa: rielaborala integralmente eliminando qualsiasi riferimento o sigla alle testate concorrenti (RomaFlash è un quotidiano indipendente: nel testo riscritto non devono MAI comparire nomi o sigle di fonti esterne come VG o Vocegiallorossa).

Se l'articolo è valido (non è un duplicato e non è spam), procedi con la rielaborazione:
1. Scrivi un nuovo titolo in italiano (diverso dall'originale). Se l'articolo riguarda un'intervista o dichiarazioni, usa la formula: Soggetto: "Virgolettato d'impatto" (es. Ranieri: "A Roma servono uomini veri", Dybala: "Voglio vincere qui").
2. Scrivi un breve riassunto di 2 righe (excerpt) in italiano per la homepage.
3. Riscrivi l'intero articolo in italiano in modo discorsivo, fluido e professionale.
   FEDELTÀ DELLE INTERVISTE & VIRGOLETTATI REALI (REGOLA FONDAMENTALE):
   Se l'articolo contiene interviste, conferenze stampa o dichiarazioni rilasciate dai protagonisti (calciatori, allenatore, dirigenti, opinionisti):
   - PRESERVA e RIPORTA SEMPRE TRA VIRGOLETTE ("...") le loro parole esatte e i virgolettati originali, evitando assolutamente di parafrasarli, censurarli o annacquarli.
   - Ogni dichiarazione o citazione testuale significativa DEVE essere posizionata su una propria riga isolata che inizia con il carattere '>' nel formato:
     > "Dichiarazione testuale esatta del protagonista..." — Nome Autore
   - Il resto dell'articolo (contesto, analisi, cronaca) deve essere scritto in normali paragrafi narrativi.
4. ESTREMA IMPORTANZA: Se l'articolo parla di probabili formazioni, formazioni ufficiali o schieramenti in campo dell'AS Roma, devi estrarre il modulo e i giocatori, valorizzando l'oggetto "formation". Altrimenti, lascialo a null.
5. NUOVA REGOLA (Sondaggi): Se l'articolo riguarda un tema dibattuto (es. calciomercato, esonero, polemica, scelta di formazione), genera un SONDAGGIO con una domanda e 3 opzioni per far votare i tifosi. Altrimenti "poll": null.
6. NUOVA REGOLA (Social Embed): Se IL NOME DELLA FONTE è "AS Roma (Ufficiale)", questa è una notizia Social: estrai l'URL del post (modificando eventuali nitter in twitter.com) e salvalo in "social_embed_url" e imposta TASSATIVAMENTE "category" a "Social". SE INVECE IL NOME DELLA FONTE NON E' "AS Roma (Ufficiale)" ALLORA NON DEVI MAI categorizzarlo come "Social" E NON DEVI MAI ESTRARRE UN "social_embed_url" (impostalo a null), anche se l'articolo contiene dei tweet all'interno.
7. VERSIONE INGLESE ("en"): Fornisci sempre anche l'adattamento giornalistico in lingua inglese nell'oggetto "en" (title, excerpt, content, e poll se presente), usando il naturale gergo calcistico anglosassone per i tifosi internazionali dell'AS Roma. Per i virgolettati, mantieni la riga isolata con '>' e le parole esatte tradotte (es. > "Exact translated quote..." — Author Name).
8. PREPARAZIONE POST X / TWITTER ("tweet_text" e "dynamic_hashtags"):
   Tutte le notizie (eccetto quelle Social) vengono preparate per la pubblicazione su X.
   I post devono essere puramente editoriali, INCISIVI e STRUTTURATI RIGOROSAMENTE IN 3 BLOCCHI (massimo 130-150 caratteri complessivi):
   - Blocco 1 (L'Hook iniziale): Notizia nuda e cruda (8-10 parole) introdotta da 1 sola emoji tematica (🚨, 💣, 📉, 🎙️ o 📊).
   - Blocco 2 (Dettaglio/Tensione): La cifra esatta, il verdetto medico, il minuto o il virgolettato chiave.
   - Blocco 3 (La Miccia / Bivio obbligatorio): Una domanda secca a bivio polarizzante che spinge i tifosi a commentare (es: "Scelta giusta o azzardo? ⬇️", "Cessione inevitabile o errore? ⬇️", "Favorevoli o contrari? ⬇️", "Da 1 a 10 quanto vi convince? ⬇️").
   DIVIETO ASSOLUTO di preamboli narrativi o celebrativi ("Serata speciale...", "Buone notizie...", "Si chiude la...", "Pienamente integrato...", "Arrivano conferme...", "Ex Roma...").
   Assolutamente SENZA LINK, SENZA URL e SENZA hashtag nel testo (gli hashtag vengono gestiti dal sistema).
   Scrivi in "dynamic_hashtags" AL MASSIMO 1 hashtag caldo e specifico (es. "#Dybala", "#Bove", "#Calciomercato"), oppure lascialo vuoto "" se la notizia è generica. NON inserire #ASRoma e #RomaFlash.
9. CONTROLLO VISIVO IMMAGINE ("is_clean_real_photo"):
   Se ti è stata allegata un'immagine, verifica se è una FOTOGRAFIA REALE utilizzabile oppure se ha un watermark del sito fonte / è una grafica digitale.
   Imposta "is_clean_real_photo": true per TUTTE le fotografie reali (di partite, calciatori, allenatori, stadi, trofei, conferenze stampa, cene o eventi), ANCHE SE all'interno della scena fotografata compaiono normali elementi del mondo reale come:
   - Sponsor sulle maglie da gioco (es. "EUROBET.live", "Riyadh Season", "Wizz", "Adidas", stemmi dell'AS Roma o di altri club/competizioni cuciti sulla divisa);
   - Cartelloni pubblicitari/LED a bordocampo (es. "UEFA", sponsor), fondali di sale stampa (es. "Coppa Italia Frecciarossa"), microfoni, striscioni fisici appesi al muro (es. "Roma Club...") o schermi/proiettori fisici presenti nella stanza dell'evento.
   Imposta "is_clean_real_photo": false SOLO SE l'immagine presenta:
   - Un watermark o logo digitale sovraimpresso sopra la foto dalla testata giornalistica (es. la scritta "ROMANEWS.EU", "VoceGiallorossa", "ForzaRoma", "TMW", "Sky Sport" applicata digitalmente sull'immagine);
   - NON è una fotografia, ma una grafica digitale creata al computer (es. solo un logo su sfondo colorato piatto come il logo della Serie A, una locandina/card grafica di auguri "Happy Birthday" con disegni e font decorativi sovraimpressi, una tabella di statistiche/formazioni o uno screenshot di un post social/sito).

Rispondi SOLO con un oggetto JSON valido con questa struttura esatta:
{
  "is_duplicate": false, 
  "is_spam": false, 
  "is_clean_real_photo": true,
  "tweet_text": "🚨 Esami per Dybala: lesione esclusa. La Joya punta alla maglia da titolare con l'Inter.\n\nGiusto rischiarlo dal 1' o meglio tenerlo per la ripresa? ⬇️",
  "dynamic_hashtags": "#Dybala",
  "titolo": "Nuovo titolo", 
  "excerpt": "Breve riassunto", 
  "content": "Testo completo dell'articolo riscritto...", 
  "category": "Probabili Formazioni, Calciomercato, Infortunio, Dichiarazioni, Partita, Social o Altro", 
  "sentiment": "Positivo, Negativo o Neutro",
  "social_embed_url": null,
  "formation": {
    "modulo": "4-3-3",
    "portiere": ["Svilar"],
    "difensori": ["Celik", "Mancini", "Ndicka", "Angelino"],
    "centrocampisti": ["Cristante", "Paredes", "Pellegrini"],
    "attaccanti": ["Dybala", "Dovbyk", "El Shaarawy"]
  },
  "poll": {
    "question": "Giusto esonerare l'allenatore?",
    "options": ["Sì, era ora", "No, diamogli tempo", "Colpa della società"]
  },
  "en": {
    "title": "English headline...",
    "excerpt": "Short 2-line English summary...",
    "content": "Full English article text...",
    "poll": {
      "question": "Is it right to sack the manager?",
      "options": ["Yes, it was time", "No, give him time", "The board is to blame"]
    }
  }
}
Nessuna formattazione markdown, solo il JSON puro. Se non ci sono formazioni o sondaggi, metti i rispettivi campi a null.

Nome della fonte: ${source.name}
Titolo originale: ${item.title}
Link della fonte originale: ${item.link}
Contenuto (incluso HTML): ${item.content || item.contentSnippet || "Nessun contenuto aggiuntivo."}`

          const requestParts: any[] = [{ text: prompt }];
          if (inlineImagePart) {
            requestParts.push(inlineImagePart);
          }

          let geminiData: any = null;
          try {
            geminiData = await callGemini(requestParts);
          } catch (gemErr) {
            console.error(`Impossibile ottenere risposta da Gemini per "${item.title}":`, gemErr);
            continue;
          }
          
          let aiSummary: any = {}
          let newTitle = item.title
          let isCleanRealPhoto = false

          try {
            // Estrai il testo dalla risposta di Gemini
            const textResponse = geminiData.candidates[0].content.parts[0].text
            // Prova a parsare l'array JSON dalla risposta (pulendo eventuale markdown)
            const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(cleanJson)

            if (parsed.is_duplicate === true) {
              console.log(`DUPLICATO INTELLIGENTE RILEVATO DA GEMINI: ${item.title}`);
              continue; // Salta il salvataggio su Supabase
            }
            
            if (parsed.is_spam === true) {
              console.log(`SPAM O OFF-TOPIC RILEVATO DA GEMINI: ${item.title}`);
              continue; // Salta il salvataggio su Supabase
            }

            isCleanRealPhoto = parsed.is_clean_real_photo === true;

            if (parsed.titolo) {
              newTitle = parsed.titolo.replace(/<bos>/g, '').replace(/<eos>/g, '').replace(/\*\*2/g, '').replace(/<[^>]+>/g, '');
            }

            // Secondo controllo deterministico: confronta anche il titolo e l'excerpt generati da Gemini con gli articoli già a DB
            const matchedGeneratedDup = isArticleTooSimilar(
              newTitle,
              parsed.excerpt || '',
              existingItemsArray
            );
            if (matchedGeneratedDup) {
              console.log(`DUPLICATO RILEVATO DAL FILTRO DETERMINISTICO (Generato): "${newTitle}" ~ "${matchedGeneratedDup}"`);
              continue;
            }

            // Controllo guard finale: scarta tassativamente se il titolo, excerpt o content contengono riferimenti a VG/VoceGiallorossa
            const genCheck = `${newTitle} ${parsed.excerpt || ''} ${parsed.content || ''}`.toLowerCase();
            if (
              /\bvg\b/i.test(genCheck) ||
              /\bvocegiallorossa\b/i.test(genCheck) ||
              /\bvoce\s+giallorossa\b/i.test(genCheck) ||
              /\bpodcast\s*vg\b/i.test(genCheck)
            ) {
              console.log(`[GUARD] Scartato articolo generato con riferimento a VG/VoceGiallorossa: "${newTitle}"`);
              continue;
            }
            if (parsed.excerpt && parsed.content) {
              aiSummary = { 
                excerpt: parsed.excerpt, 
                content: parsed.content,
                category: parsed.category || "Altro",
                sentiment: parsed.sentiment || "Neutro",
                formation: parsed.formation || null,
                social_embed_url: parsed.social_embed_url || null,
                poll: parsed.poll || null,
                en: parsed.en || null,
                tweet_text: parsed.tweet_text || null,
                dynamic_hashtags: parsed.dynamic_hashtags || null
              }
              
              // Fallback: se l'articolo PROVIENE direttamente da Twitter/Nitter, forza il social_embed_url
              if ((item.link.includes('nitter') || item.link.includes('twitter.com') || item.link.includes('x.com')) && !aiSummary.social_embed_url) {
                  aiSummary.social_embed_url = item.link.replace(/nitter.[a-z]+/, 'twitter.com').replace('x.com', 'twitter.com');
                  aiSummary.category = "Social";
              }
            } else {
              console.error("Gemini response missing required fields:", parsed)
              continue; // Salta il salvataggio se mancano i campi per non pubblicare vuoto
            }
          } catch (e) {
            console.error("Errore nel parsing della risposta di Gemini:", e, geminiData)
            continue; // Salta il salvataggio in caso di errore di parsing
          }

          // Scelta finale dell'immagine: se la foto della fonte ha loghi/grafiche o non è valida, usa una delle 19 immagini proprietarie RomaFlash (incluse le 3 storiche del briefing: Stadio Olimpico, pallone in campo e sala stampa) non usate di recente
          let imageUrl: string;
          if (!isImageRejected && inlineImagePart && isCleanRealPhoto && candidateImageUrl) {
            imageUrl = candidateImageUrl;
            usedImageUrls.add(candidateImageUrl);
          } else {
            const allArchive = Array.from({ length: 19 }, (_, i) => `/images/archive/roma-${i + 1}.jpg`);
            const availableArchive = allArchive.filter(p => !recentArchiveUsed.has(p));
            const pool = availableArchive.length > 0 ? availableArchive : allArchive;
            imageUrl = pool[Math.floor(Math.random() * pool.length)];
            recentArchiveUsed.add(imageUrl);
            console.log(`[IMAGE FILTER] Immagine fonte scartata (grafica/logo/mancante) -> assegnata ${imageUrl}`);
          }

          // 5. Determina la data di pubblicazione (Falsificazione a fin di bene se è in ritardo)
          let finalPublishedAt = item.isoDate || item.pubDate || new Date().toISOString()
          const articleTime = new Date(finalPublishedAt).getTime()
          
          if (articleTime < latestPublishedAt) {
            console.log(`[TIME OVERRIDE] Articolo in ritardo rilevato. Originale: ${finalPublishedAt}. Forzato a NOW().`)
            finalPublishedAt = new Date().toISOString()
          }

          // 6. Salva su Supabase e recupera l'ID generato
          const { data: insertedArticle, error: insertError } = await supabase
            .from('articles')
            .insert({
              source_id: source.id,
              title: newTitle,
              original_url: item.link,
              image_url: imageUrl,
              ai_summary: aiSummary,
              published_at: finalPublishedAt
            })
            .select('id')
            .single()

          if (insertError) {
            console.error(`Errore inserimento in DB per: ${item.title}`, insertError)
          } else {
            processedCount++;
            existingItemsArray.push({
              title: newTitle,
              fullText: `${newTitle} ${aiSummary.excerpt || ''}`,
            });
            recentTitlesList += `\n- ${newTitle} (${aiSummary.excerpt || ''})`;

            // Raccoglie gli articoli inseriti idonei per X (esclusi post Social)
            const isSocialPost =
              aiSummary.category === 'Social' ||
              Boolean(aiSummary.social_embed_url) ||
              source.name === 'AS Roma (Ufficiale)';

            if (insertedArticle?.id && !isSocialPost) {
              eligibleNewArticlesForX.push({
                id: insertedArticle.id,
                title: newTitle,
                image_url: imageUrl,
                ai_summary: aiSummary,
              });
            }
            
            // Invia notifica push
            const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')
            const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
            
            if (vapidPublic && vapidPrivate) {
              webpush.setVapidDetails('mailto:hello@romaflash.com', vapidPublic, vapidPrivate)
              
              const { data: subs } = await supabase.from('push_subscriptions').select('*')
              if (subs && subs.length > 0) {
                const payload = JSON.stringify({
                  title: newTitle,
                  body: aiSummary.excerpt || "Nuovo articolo su RomaFlash",
                  url: insertedArticle?.id ? `/article?id=${insertedArticle.id}` : `/?refresh=1`
                })
                
                console.log(`Invio notifica a ${subs.length} iscritti...`)
                for (const sub of subs) {
                  try {
                    await webpush.sendNotification(sub.subscription, payload)
                  } catch (e) {
                    console.error('Errore invio push a utente (potrebbe essersi disiscritto):', e)
                    // Opzionale: se l'errore è 410 (Gone), cancella la sub dal DB
                    if (e.statusCode === 410) {
                      await supabase.from('push_subscriptions').delete().eq('id', sub.id)
                    }
                  }
                }
              }
            }
          }
        }
      } catch (feedError) {
        console.error(`Errore nel fetching della fonte ${source.name}:`, feedError)
      }
    }

    // 7. Gestione intelligente della coda X: massimo 1 tweet per run, spaziato di almeno 20 minuti
    // 7. Auto-pubblicazione automatica disattivata: la pubblicazione su X viene gestita manualmente on-demand dalla dashboard /stats per garantire massimo controllo su copy, bivio e tempismo strategico.
    console.log(`[X POSTING] Pubblicazione automatica in background disattivata. Gestione manuale on-demand attiva su /stats.`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Elaborazione completata. Nuovi articoli aggiunti: ${processedCount}`,
      tweets_today: tweetsTodayCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})


