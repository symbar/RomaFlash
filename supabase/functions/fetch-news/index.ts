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

async function postToX(
  tweetText: string,
  imageUrl?: string | null
): Promise<{ id?: string; url?: string; error?: string }> {
  const bufferApiKey = Deno.env.get('BUFFER_API_KEY')
  const bufferChannelId = Deno.env.get('BUFFER_CHANNEL_ID') || '6acbee4e778b240e2fdc27e7'

  if (!bufferApiKey) {
    return { error: 'BUFFER_API_KEY non configurata su Supabase' }
  }

  const publicImageUrl = resolvePublicImageUrl(imageUrl)

  if (publicImageUrl) {
    const mediaMutation = `
      mutation CreatePostWithImage($text: String!, $channelId: ChannelId!, $imageUrl: String!) {
        createPost(
          input: {
            text: $text
            channelId: $channelId
            schedulingType: automatic
            mode: shareNow
            assets: [
              {
                image: {
                  url: $imageUrl
                }
              }
            ]
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
    try {
      const mediaRes = await fetch('https://api.buffer.com', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bufferApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mediaMutation,
          variables: {
            text: tweetText,
            channelId: bufferChannelId,
            imageUrl: publicImageUrl,
          },
        }),
      })
      const mediaData = await mediaRes.json()
      const mediaPost = mediaData?.data?.createPost?.post
      if (mediaPost?.id) {
        return { id: mediaPost.id, url: mediaPost.externalLink || undefined }
      }
      console.warn(
        '[X AUTO-POST] Invio con immagine non riuscito, fallback a link card:',
        mediaData?.data?.createPost?.message || JSON.stringify(mediaData)
      )
    } catch (e) {
      console.warn('[X AUTO-POST] Errore invio immagine a Buffer, fallback a link card:', e)
    }
  }

  const mutation = `
    mutation CreatePost($text: String!, $channelId: ChannelId!) {
      createPost(
        input: {
          text: $text
          channelId: $channelId
          schedulingType: automatic
          mode: shareNow
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
        },
      }),
    })

    const data = await res.json()
    const post = data?.data?.createPost?.post
    if (post?.id) {
      return { id: post.id, url: post.externalLink || undefined }
    }
    const errMsg = data?.data?.createPost?.message || JSON.stringify(data)
    console.error('Errore Buffer API:', errMsg)
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
      const cleanBase = (aiSummary.tweet_text || `🐺🟡🔴 ${art.title}\n\n${aiSummary.excerpt}`)
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/#[a-zA-Z0-9_]+/g, '')
        .trim();
      const extraTags = (aiSummary.dynamic_hashtags || '')
        .replace(/#ASRoma/gi, '')
        .replace(/#RomaFlash/gi, '')
        .trim();
      const footer = `\n\n⚡ RomaFlash  #ASRoma${extraTags ? ` ${extraTags}` : ''}`;
      
      let baseText = cleanBase;
      if (baseText.length < 180 && aiSummary.excerpt) {
        const cleanExcerpt = aiSummary.excerpt.replace(/https?:\/\/\S+/gi, '').replace(/#[a-zA-Z0-9_]+/g, '').trim();
        if (!baseText.toLowerCase().includes(cleanExcerpt.substring(0, 25).toLowerCase())) {
          baseText = `${baseText} ${cleanExcerpt}`.trim();
        }
      }

      const maxBaseLength = 278 - footer.length;
      let truncatedBase = baseText;
      if (baseText.length > maxBaseLength) {
        const lastSpace = baseText.lastIndexOf(' ', maxBaseLength - 3);
        truncatedBase = (lastSpace > 100 ? baseText.substring(0, lastSpace) : baseText.substring(0, maxBaseLength - 3)).trim() + '...';
      }
      const fullTweet = `${truncatedBase}${footer}`;

      console.log(`[X MANUAL REPUBLISH] Invio tweet nativo per articolo ${art.id}: "${fullTweet}"`);
      const xRes = await postToX(fullTweet, art.image_url);

      if (xRes.id) {
        aiSummary.x_tweet_id = xRes.id;
        if (xRes.url) aiSummary.x_tweet_url = xRes.url;
        aiSummary.x_posted_at = new Date().toISOString();
        await supabase.from('articles').update({ ai_summary: aiSummary }).eq('id', art.id);
        return new Response(JSON.stringify({ success: true, tweetId: xRes.id, tweetUrl: xRes.url, fullTweet }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: xRes.error, fullTweet }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY non configurata")

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
      
    const usedImageUrls = new Set<string>(
      (recentArticles || [])
        .map((a: any) => a.image_url)
        .filter((u: any) => typeof u === 'string' && u.startsWith('http'))
    );
      
    const latestPublishedAt = recentArticles && recentArticles.length > 0 
      ? new Date(recentArticles[0].published_at).getTime() 
      : 0;

    // Conteggio informativo dei tweet pubblicati oggi (fuso Europe/Rome)
    const getRomeDateStr = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(d);
    const todayRome = getRomeDateStr(new Date());

    let tweetsTodayCount = 0;
    if (recentArticles) {
      for (const art of recentArticles) {
        const postedAt = art.ai_summary?.x_posted_at;
        if (postedAt && getRomeDateStr(new Date(postedAt)) === todayRome) {
          tweetsTodayCount++;
        }
      }
    }
    console.log(`[X AUTO-POST] Tweet notizie già pubblicati oggi (${todayRome}): ${tweetsTodayCount}`);

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

    const isArticleTooSimilar = (
      candidateTitle: string,
      candidateExtra: string,
      existingItems: ExistingArticleItem[]
    ): string | null => {
      const candTitleSet = new Set(extractTokens(candidateTitle));
      const candFullSet = new Set(extractTokens(`${candidateTitle} ${candidateExtra}`));
      if (candTitleSet.size === 0) return null;

      for (const existing of existingItems) {
        const exTitleSet = new Set(extractTokens(existing.title));
        const exFullSet = new Set(extractTokens(existing.fullText));
        if (exTitleSet.size === 0) continue;

        // 1. Intersezione diretta Titolo vs Titolo
        let titleIntersection = 0;
        for (const t of candTitleSet) {
          if (exTitleSet.has(t)) titleIntersection++;
        }
        const minTitleSize = Math.min(candTitleSet.size, exTitleSet.size);
        const titleOverlap = minTitleSize > 0 ? titleIntersection / minTitleSize : 0;

        if (titleIntersection >= 3 || (titleIntersection >= 2 && titleOverlap >= 0.4)) {
          return existing.title;
        }

        // 2. Intersezione incrociata Titolo candidato vs (Titolo + Excerpt esistente) e viceversa
        let candInExFull = 0;
        for (const t of candTitleSet) {
          if (exFullSet.has(t)) candInExFull++;
        }
        let exInCandFull = 0;
        for (const t of exTitleSet) {
          if (candFullSet.has(t)) exInCandFull++;
        }
        if (candInExFull >= 3 || exInCandFull >= 3) {
          return existing.title;
        }

        // 3. Intersezione complessiva (Titolo + Excerpt) vs (Titolo + Excerpt)
        let fullIntersection = 0;
        for (const t of candFullSet) {
          if (exFullSet.has(t)) fullIntersection++;
        }
        if (fullIntersection >= 5) {
          return existing.title;
        }
      }
      return null;
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

    // 3. Itera su ogni fonte
    for (const source of sources) {
      console.log(`Analizzando fonte: ${source.name} (${source.rss_url})`)
      
      try {
        const feed = await parser.parseURL(source.rss_url)
        
        // Prendiamo solo le ultime 2 notizie per fonte ad ogni giro
        const items = feed.items.slice(0, 2)

        for (const item of items) {
          if (!item.link || !item.title) continue;

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
                signal: AbortSignal.timeout(4000)
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

          // Scarica i byte dell'immagine per farla ispezionare visivamente da Gemini Vision
          let inlineImagePart: any = null;
          if (candidateImageUrl && !isImageRejected) {
            try {
              const imgRes = await fetch(candidateImageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                signal: AbortSignal.timeout(3500)
              });
              if (imgRes.ok) {
                const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
                const buf = await imgRes.arrayBuffer();
                if (buf.byteLength > 5000 && buf.byteLength < 3500000 && contentType.startsWith('image/')) {
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

2) SPAM / NOTIZIE NON PERTINENTI: verifica se la notizia parla effettivamente dell'AS Roma o dei suoi prossimi avversari. Se non c'entra nulla, imposta "is_spam" a true. ATTENZIONE: I post dai canali social ufficiali (AS Roma) NON SONO MAI SPAM.

Se l'articolo è valido (non è un duplicato e non è spam), procedi con la rielaborazione:
1. Scrivi un nuovo titolo in italiano (diverso dall'originale).
2. Scrivi un breve riassunto di 2 righe (excerpt) in italiano per la homepage.
3. Riscrivi l'intero articolo in italiano in modo discorsivo, fluido e professionale. Se l'articolo contiene interviste o dichiarazioni (di calciatori, mister o dirigenti), PRESERVA e RIPORTA SEMPRE TRA VIRGOLETTE ("...") le loro parole esatte e i virgolettati originali, evitando di parafrasarli.
4. ESTREMA IMPORTANZA: Se l'articolo parla di probabili formazioni, formazioni ufficiali o schieramenti in campo dell'AS Roma, devi estrarre il modulo e i giocatori, valorizzando l'oggetto "formation". Altrimenti, lascialo a null.
5. NUOVA REGOLA (Sondaggi): Se l'articolo riguarda un tema dibattuto (es. calciomercato, esonero, polemica, scelta di formazione), genera un SONDAGGIO con una domanda e 3 opzioni per far votare i tifosi. Altrimenti "poll": null.
6. NUOVA REGOLA (Social Embed): Se IL NOME DELLA FONTE è "AS Roma (Ufficiale)", questa è una notizia Social: estrai l'URL del post (modificando eventuali nitter in twitter.com) e salvalo in "social_embed_url" e imposta TASSATIVAMENTE "category" a "Social". SE INVECE IL NOME DELLA FONTE NON E' "AS Roma (Ufficiale)" ALLORA NON DEVI MAI categorizzarlo come "Social" E NON DEVI MAI ESTRARRE UN "social_embed_url" (impostalo a null), anche se l'articolo contiene dei tweet all'interno.
7. VERSIONE INGLESE ("en"): Fornisci sempre anche l'adattamento giornalistico in lingua inglese nell'oggetto "en" (title, excerpt, content, e poll se presente), usando il naturale gergo calcistico anglosassone per i tifosi internazionali dell'AS Roma.
8. AUTO-PUBBLICAZIONE X / TWITTER ("tweet_text" e "dynamic_hashtags"):
   Tutte le notizie (eccetto quelle Social) vengono pubblicate sul profilo ufficiale X di RomaFlash in modalità 100% nativa.
   Scrivi in "tweet_text" un recap nativo completo, denso, approfondito e ricco di dettagli per X che sfrutti appieno lo spazio dei 280 caratteri consentiti (scrivi ESATTAMENTE tra 200 e 240 caratteri, con 1-2 emoji pertinenti, assolutamente SENZA LINK, SENZA URL e SENZA domini web, e SENZA hashtag perché verranno aggiunti dal sistema). Non limitarti a una frase breve: racconta il fatto centrale, i dettagli, i numeri o il virgolettato chiave in modo che chi legge su X abbia una vera e propria notizia completa ed esaustiva.
   Scrivi in "dynamic_hashtags" 1 o 2 hashtag caldi e pertinenti alla notizia specifica (es. "#Dybala", "#RomaInter", "#Calciomercato"), SENZA includere #ASRoma e #RomaFlash che sono già fissi.
9. CONTROLLO VISIVO IMMAGINE ("is_clean_real_photo"):
   Se ti è stata allegata un'immagine, controllala con estrema severità.
   Imposta "is_clean_real_photo": false SE l'immagine contiene UNO QUALSIASI di questi elementi:
   - Loghi, stemmi, scritte o watermark della testata giornalistica o sito fonte (es. "Voce Giallorossa", "ForzaRoma", "RomaNews", "Tuttomercatoweb", "FootyHeadlines", "Sky", "DAZN", ecc.) in un angolo o sovraimpressi;
   - Grafiche fatte a mano dalla fonte (es. risultati "FULL TIME 0-0", tabelle xG o statistiche, grafiche di formazioni, locandine di rubriche/podcast, fotomontaggi con testo, banner, screenshot di social o siti).
   Imposta "is_clean_real_photo": true SOLO SE è una fotografia reale e pulita, totalmente priva di loghi di siti terzi, watermark o grafiche redazionali. Nel minimo dubbio, imposta "is_clean_real_photo": false!

Rispondi SOLO con un oggetto JSON valido con questa struttura esatta:
{
  "is_duplicate": false, 
  "is_spam": false, 
  "is_clean_real_photo": true,
  "tweet_text": "🚨 Ultime da Trigoria: Dybala torna in gruppo alla vigilia del match! Scelte quasi fatte in attacco 🐺🟡🔴",
  "dynamic_hashtags": "#Dybala #SerieA",
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

          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: requestParts }],
                generationConfig: { temperature: 0.1 }
              }),
            }
          )

          const geminiData = await geminiResponse.json()
          
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

          // Scelta finale dell'immagine: se la foto della fonte ha loghi/grafiche o non è valida, usa una delle 13 immagini proprietarie RomaFlash
          let imageUrl: string;
          if (!isImageRejected && inlineImagePart && isCleanRealPhoto && candidateImageUrl) {
            imageUrl = candidateImageUrl;
            usedImageUrls.add(candidateImageUrl);
          } else {
            const randomIdx = Math.floor(Math.random() * 13) + 1;
            imageUrl = `/images/archive/roma-${randomIdx}.jpg`;
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

            // 6b. Auto-Pubblicazione su X per TUTTI gli articoli (esclusi i post Social)
            const isSocialPost =
              aiSummary.category === 'Social' ||
              Boolean(aiSummary.social_embed_url) ||
              source.name === 'AS Roma (Ufficiale)';

            if (insertedArticle?.id && !isSocialPost) {
              const cleanBase = (aiSummary.tweet_text || `🐺🟡🔴 ${newTitle}\n\n${aiSummary.excerpt}`)
                .replace(/https?:\/\/\S+/gi, '')
                .replace(/#[a-zA-Z0-9_]+/g, '')
                .trim();
              const extraTags = (aiSummary.dynamic_hashtags || '')
                .replace(/#ASRoma/gi, '')
                .replace(/#RomaFlash/gi, '')
                .trim();
              const footer = `\n\n⚡ RomaFlash  #ASRoma${extraTags ? ` ${extraTags}` : ''}`;
              
              let baseText = cleanBase;
              if (baseText.length < 180 && aiSummary.excerpt) {
                const cleanExcerpt = aiSummary.excerpt.replace(/https?:\/\/\S+/gi, '').replace(/#[a-zA-Z0-9_]+/g, '').trim();
                if (!baseText.toLowerCase().includes(cleanExcerpt.substring(0, 25).toLowerCase())) {
                  baseText = `${baseText} ${cleanExcerpt}`.trim();
                }
              }

              const maxBaseLength = 278 - footer.length;
              let truncatedBase = baseText;
              if (baseText.length > maxBaseLength) {
                const lastSpace = baseText.lastIndexOf(' ', maxBaseLength - 3);
                truncatedBase = (lastSpace > 100 ? baseText.substring(0, lastSpace) : baseText.substring(0, maxBaseLength - 3)).trim() + '...';
              }
              const fullTweet = `${truncatedBase}${footer}`;

              console.log(`[X AUTO-POST] Pubblicazione tweet nativo (#${tweetsTodayCount + 1} di oggi): ${newTitle}`);
              const xRes = await postToX(fullTweet, imageUrl);
              if (xRes.id) {
                console.log(`[X AUTO-POST] Tweet pubblicato con successo! ID: ${xRes.id}`);
                tweetsTodayCount++;
                aiSummary.x_tweet_id = xRes.id;
                if (xRes.url) {
                  aiSummary.x_tweet_url = xRes.url;
                }
                aiSummary.x_posted_at = new Date().toISOString();
                await supabase
                  .from('articles')
                  .update({ ai_summary: aiSummary })
                  .eq('id', insertedArticle.id);
              } else {
                console.error(`[X AUTO-POST] Errore pubblicazione su X:`, xRes.error);
              }
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


