import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import Parser from "https://esm.sh/rss-parser@3.13.0"
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function postToX(tweetText: string): Promise<{ id?: string; error?: string }> {
  const bufferApiKey = Deno.env.get('BUFFER_API_KEY')
  const bufferChannelId = Deno.env.get('BUFFER_CHANNEL_ID') || '6acbee4e778b240e2fdc27e7'

  if (!bufferApiKey) {
    return { error: 'BUFFER_API_KEY non configurata su Supabase' }
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
    const postId = data?.data?.createPost?.post?.id
    if (postId) {
      return { id: postId }
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
      .select('title, ai_summary, published_at')
      .gte('published_at', thirtySixHoursAgo)
      .not('original_url', 'like', 'romaflash-daily-briefing-%')
      .order('published_at', { ascending: false });
      
    const latestPublishedAt = recentArticles && recentArticles.length > 0 
      ? new Date(recentArticles[0].published_at).getTime() 
      : 0;

    // Calcolo quota giornaliera X (max 11 notizie standard + 1 Punto della Giornata = 12 post/giorno)
    const MAX_NEWS_TWEETS_PER_DAY = 11;
    const MIN_TWEET_COOLDOWN_MS = 25 * 60 * 1000; // Minimo 25 minuti tra due tweet automatici
    const getRomeDateStr = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(d);
    const todayRome = getRomeDateStr(new Date());

    let tweetsTodayCount = 0;
    let lastTweetTimeMs = 0;
    let hasTweetedThisRun = false;

    if (recentArticles) {
      for (const art of recentArticles) {
        const postedAt = art.ai_summary?.x_posted_at;
        if (postedAt) {
          const postedDate = new Date(postedAt);
          if (getRomeDateStr(postedDate) === todayRome) {
            tweetsTodayCount++;
          }
          if (postedDate.getTime() > lastTweetTimeMs) {
            lastTweetTimeMs = postedDate.getTime();
          }
        }
      }
    }
    console.log(`[X AUTO-POST] Tweet notizie pubblicati oggi (${todayRome}): ${tweetsTodayCount}/${MAX_NEWS_TWEETS_PER_DAY}`);

    // Funzione deterministica anti-duplicato: normalizza testo rimuovendo punteggiatura e stop-words
    const stopWords = new Set(['como', 'roma', 'della', 'delle', 'degli', 'dello', 'nella', 'nelle', 'negli', 'sulla', 'sulle', 'sugli', 'contro', 'verso', 'prima', 'dopo', 'anche', 'sono', 'stato', 'stata', 'questo', 'questa', 'quello', 'quella', 'tutto', 'tutti', 'tutte', 'molto', 'solo', 'fare', 'fatto', 'essere', 'avere', 'hanno', 'alla', 'alle', 'agli', 'dalla', 'dalle', 'dagli', 'con', 'per', 'tra', 'fra', 'che', 'non', 'piu', 'suo', 'sua', 'suoi', 'sue', 'loro', 'gli', 'una', 'uno', 'dei', 'del', 'dal', 'nel', 'sul', 'col']);
    const extractTokens = (str: string): string[] => {
      return (str || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 4 && !stopWords.has(w));
    };

    const isTitleTooSimilar = (candidateTitle: string, existingTitles: string[]): string | null => {
      const candTokens = extractTokens(candidateTitle);
      if (candTokens.length === 0) return null;
      const candSet = new Set(candTokens);

      for (const existing of existingTitles) {
        const exTokens = extractTokens(existing);
        if (exTokens.length === 0) continue;
        const exSet = new Set(exTokens);

        let intersection = 0;
        for (const t of candSet) {
          if (exSet.has(t)) intersection++;
        }

        const minSize = Math.min(candSet.size, exSet.size);
        const overlapRatio = minSize > 0 ? intersection / minSize : 0;

        // Se condividono almeno 3 parole chiave specifiche o >= 50% dei termini chiave, è lo stesso argomento
        if (intersection >= 3 || (intersection >= 2 && overlapRatio >= 0.5)) {
          return existing;
        }
      }
      return null;
    };

    const existingTitlesArray: string[] = recentArticles ? recentArticles.map(a => a.title) : [];

    let recentTitlesList = recentArticles && recentArticles.length > 0 
      ? recentArticles.map(a => `- ${a.title}${a.ai_summary?.excerpt ? ` (${a.ai_summary.excerpt})` : ''}`).join('\n')
      : "Nessun articolo recente."

    const parser = new Parser()
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

          // Controllo deterministico preliminare sul titolo originale RSS contro i titoli già pubblicati
          const matchedOriginalDup = isTitleTooSimilar(item.title, existingTitlesArray);
          if (matchedOriginalDup) {
            console.log(`DUPLICATO RILEVATO DAL FILTRO DETERMINISTICO (Titolo RSS): "${item.title}" ~ "${matchedOriginalDup}"`);
            continue;
          }

          console.log(`Nuova notizia trovata: ${item.title}`)

          // 4. Chiama Gemini per il riassunto e il controllo anti-spam
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
- Se nella lista c'è già un'intervista o dichiarazione della stessa persona (es. Vierchowod, Capello, Fabregas, Gasperini, Tchouameni) sullo stesso tema -> È DUPLICATO (is_duplicate: true).
- Se due testate diverse riportano la stessa notizia (es. infortunio di un giocatore, designazione arbitrale, conferenza stampa) con parole diverse -> È DUPLICATO (is_duplicate: true).
Nel dubbio, imposta SEMPRE "is_duplicate": true!

2) SPAM / NOTIZIE NON PERTINENTI: verifica se la notizia parla effettivamente dell'AS Roma o dei suoi prossimi avversari. Se non c'entra nulla, imposta "is_spam" a true. ATTENZIONE: I post dai canali social ufficiali (AS Roma) NON SONO MAI SPAM.

Se l'articolo è valido (non è un duplicato e non è spam), procedi con la rielaborazione:
1. Scrivi un nuovo titolo in italiano (diverso dall'originale).
2. Scrivi un breve riassunto di 2 righe (excerpt) in italiano per la homepage.
3. Riscrivi l'intero articolo in italiano in modo discorsivo, fluido e professionale.
4. ESTREMA IMPORTANZA: Se l'articolo parla di probabili formazioni, formazioni ufficiali o schieramenti in campo dell'AS Roma, devi estrarre il modulo e i giocatori, valorizzando l'oggetto "formation". Altrimenti, lascialo a null.
5. NUOVA REGOLA (Sondaggi): Se l'articolo riguarda un tema dibattuto (es. calciomercato, esonero, polemica, scelta di formazione), genera un SONDAGGIO con una domanda e 3 opzioni per far votare i tifosi. Altrimenti "poll": null.
6. NUOVA REGOLA (Social Embed): Se IL NOME DELLA FONTE è "AS Roma (Ufficiale)", questa è una notizia Social: estrai l'URL del post (modificando eventuali nitter in twitter.com) e salvalo in "social_embed_url" e imposta TASSATIVAMENTE "category" a "Social". SE INVECE IL NOME DELLA FONTE NON E' "AS Roma (Ufficiale)" ALLORA NON DEVI MAI categorizzarlo come "Social" E NON DEVI MAI ESTRARRE UN "social_embed_url" (impostalo a null), anche se l'articolo contiene dei tweet all'interno.
7. VERSIONE INGLESE ("en"): Fornisci sempre anche l'adattamento giornalistico in lingua inglese nell'oggetto "en" (title, excerpt, content, e poll se presente), usando il naturale gergo calcistico anglosassone per i tifosi internazionali dell'AS Roma.
8. AUTO-PUBBLICAZIONE X / TWITTER ("is_breaking", "tweet_text" e "dynamic_hashtags"):
   Selezioniamo fino a 11 notizie importanti al giorno per il profilo ufficiale X di RomaFlash.
   Imposta "is_breaking": true per tutte le notizie di rilievo (formazioni probabili/ufficiali, infortuni, conferenze stampa, dichiarazioni importanti di allenatore/giocatori/dirigenti, calciomercato, partite, comunicati ufficiali). Imposta "is_breaking": false solo per notizie minori, curiosità secondarie o amarcord.
   Scrivi in "tweet_text" un post magnetico in italiano per X (massimo 170 caratteri, con 1-2 emoji pertinenti, SENZA URL e SENZA hashtag perché verranno aggiunti dal sistema).
   Scrivi in "dynamic_hashtags" 2 hashtag caldi e pertinenti alla notizia specifica (es. "#ComoRoma #Gasperini", "#Dybala #SerieA", "#RomaRealMadrid #ChampionsLeague", "#Calciomercato #Svilar"), SENZA includere #ASRoma e #RomaFlash che sono già fissi.

Rispondi SOLO con un oggetto JSON valido con questa struttura esatta:
{
  "is_duplicate": false, 
  "is_spam": false, 
  "is_breaking": true,
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

          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1 }
              }),
            }
          )

          const geminiData = await geminiResponse.json()
          
          let aiSummary: any = {}
          let newTitle = item.title

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

            if (parsed.titolo) {
              newTitle = parsed.titolo.replace(/<bos>/g, '').replace(/<eos>/g, '').replace(/\*\*2/g, '').replace(/<[^>]+>/g, '');
            }

            // Secondo controllo deterministico: confronta anche il titolo generato da Gemini con i titoli già a DB
            const matchedGeneratedDup = isTitleTooSimilar(newTitle, existingTitlesArray);
            if (matchedGeneratedDup) {
              console.log(`DUPLICATO RILEVATO DAL FILTRO DETERMINISTICO (Titolo Generato): "${newTitle}" ~ "${matchedGeneratedDup}"`);
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
                is_breaking: parsed.is_breaking === true,
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

          // Per ora disabilitiamo l'immagine originale come richiesto
          const imageUrl = null

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
            existingTitlesArray.push(newTitle);
            recentTitlesList += `\n- ${newTitle} (${aiSummary.excerpt || ''})`;

            // 6b. Auto-Pubblicazione su X (Max 11 notizie importanti al giorno + cooldown 25 min)
            const nowMs = Date.now();
            const cooldownElapsed = (nowMs - lastTweetTimeMs) >= MIN_TWEET_COOLDOWN_MS;
            if (
              insertedArticle?.id &&
              aiSummary.is_breaking === true &&
              tweetsTodayCount < MAX_NEWS_TWEETS_PER_DAY &&
              !hasTweetedThisRun &&
              cooldownElapsed
            ) {
              const articleUrl = `https://romaflash.app/article?id=${insertedArticle.id}`;
              const cleanBase = (aiSummary.tweet_text || `🐺🟡🔴 ${newTitle}\n\n${aiSummary.excerpt}`)
                .replace(/#[a-zA-Z0-9_]+/g, '')
                .trim();
              const extraTags = (aiSummary.dynamic_hashtags || '')
                .replace(/#ASRoma/gi, '')
                .replace(/#RomaFlash/gi, '')
                .trim();
              const hashtagsLine = extraTags ? `#ASRoma #RomaFlash ${extraTags}` : `#ASRoma #RomaFlash`;
              const fullTweet = `${cleanBase}\n\n👉 Leggi qui: ${articleUrl}\n\n${hashtagsLine}`;

              console.log(`[X AUTO-POST] Pubblicazione tweet (${tweetsTodayCount + 1}/${MAX_NEWS_TWEETS_PER_DAY}): ${newTitle}`);
              const xRes = await postToX(fullTweet);
              if (xRes.id) {
                console.log(`[X AUTO-POST] Tweet pubblicato con successo! ID: ${xRes.id}`);
                hasTweetedThisRun = true;
                tweetsTodayCount++;
                lastTweetTimeMs = nowMs;
                aiSummary.x_tweet_id = xRes.id;
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


