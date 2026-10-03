import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import Parser from "https://esm.sh/rss-parser@3.13.0"
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // 2b. Recupera i titoli recenti per la deduplicazione
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentArticles } = await supabase
      .from('articles')
      .select('title, published_at')
      .gte('published_at', twentyFourHoursAgo)
      .not('original_url', 'like', 'romaflash-daily-briefing-%')
      .order('published_at', { ascending: false });
      
    const latestPublishedAt = recentArticles && recentArticles.length > 0 
      ? new Date(recentArticles[0].published_at).getTime() 
      : 0;

    let recentTitlesList = recentArticles && recentArticles.length > 0 
      ? recentArticles.map(a => `- ${a.title}`).join('\n')
      : "Nessun articolo recente."

    const parser = new Parser()
    let processedCount = 0

    // 3. Itera su ogni fonte
    for (const source of sources) {
      console.log(`Analizzando fonte: ${source.name} (${source.rss_url})`)
      
      try {
        const feed = await parser.parseURL(source.rss_url)
        
        // Prendiamo solo le ultime 5 notizie per evitare di sovraccaricare l'API al primo avvio
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

          console.log(`Nuova notizia trovata: ${item.title}`)

          // 4. Chiama Gemini per il riassunto e il controllo anti-spam
          const prompt = `Sei un giornalista sportivo esperto dell'AS Roma. 
Il tuo compito è rielaborare completamente questa notizia con uno stile editoriale accattivante.
TUTTAVIA, hai anche il compito di fare da "Filtro Anti-Spam". Devi controllare due cose:

1) DUPLICATI: verifica se questa notizia tratta LO STESSO IDENTICO EVENTO di uno dei seguenti titoli già pubblicati oggi:
---
${recentTitlesList}
---
ATTENZIONE: i titoli nella lista sopra sono stati rielaborati. Devi valutare il SENSO e l'ARGOMENTO CENTRALE, non la corrispondenza esatta delle parole. Se l'argomento centrale (es. "Lobont incontra De Rossi") è lo stesso di un articolo già in lista, DEVI impostare "is_duplicate" a true. Sii molto severo, preferiamo scartare una notizia piuttosto che avere due articoli sullo stesso evento.

2) SPAM / NOTIZIE NON PERTINENTI: verifica se la notizia parla effettivamente dell'AS Roma o di calcio. Se l'articolo è un annuncio del sito web stesso (es. "Cerchiamo collaboratori", "Lavora con noi", problemi ai server) o non c'entra nulla con la squadra, imposta "is_spam" a true. ATTENZIONE: I post e i feed provenienti dai canali social ufficiali (es. Twitter AS Roma) NON SONO MAI SPAM. Accettali sempre (is_spam: false) anche se sono auguri di compleanno, vendita biglietti o foto.

Se l'articolo è valido (non è un duplicato e non è spam), procedi con la rielaborazione:
1. Scrivi un nuovo titolo (diverso dall'originale).
2. Scrivi un breve riassunto di 2 righe (excerpt) per la homepage.
3. Riscrivi l'intero articolo in modo discorsivo, fluido e professionale.
4. ESTREMA IMPORTANZA: Se l'articolo parla di probabili formazioni, formazioni ufficiali o schieramenti in campo dell'AS Roma, devi estrarre il modulo e i giocatori, valorizzando l'oggetto "formation". Altrimenti, lascialo a null.
5. NUOVA REGOLA (Sondaggi): Se l'articolo riguarda un tema dibattuto (es. calciomercato, esonero, polemica, scelta di formazione), genera un SONDAGGIO con una domanda e 3 opzioni per far votare i tifosi. Altrimenti "poll": null.
  6. NUOVA REGOLA (Social Embed): Se la fonte o l'articolo contiene un link a un post o un Tweet ufficiale (es. da nitter, twitter, o instagram), estrai l'URL di quel post originale (modificando eventuali nitter in twitter.com) e salvalo in "social_embed_url" e imposta TASSATIVAMENTE "category" a "Social". Altrimenti "social_embed_url": null.

Rispondi SOLO con un oggetto JSON valido con questa struttura esatta:
{
  "is_duplicate": false, 
  "is_spam": false, 
  "titolo": "Nuovo titolo", 
  "excerpt": "Breve riassunto", 
  "content": "Testo completo dell'articolo riscritto...", 
  "category": "Probabili Formazioni, Calciomercato, Infortunio, Dichiarazioni, Partita o Altro", 
  "sentiment": "Positivo, Negativo o Neutro",
    "social_embed_url": "https://twitter.com/...",
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
  }
}
Nessuna formattazione markdown, solo il JSON puro. Se non ci sono formazioni o sondaggi, metti i rispettivi campi a null.

Titolo originale: ${item.title}
Contenuto originale: 
  Link della fonte originale: ${item.contentSnippet || item.content || "Nessun contenuto aggiuntivo."}`

          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3 }
              }),
            }
          )

          const geminiData = await geminiResponse.json()
          
          let aiSummary = {}
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
            if (parsed.excerpt && parsed.content) {
              aiSummary = { 
                excerpt: parsed.excerpt, 
                content: parsed.content,
                category: parsed.category || "Altro",
                sentiment: parsed.sentiment || "Neutro",
                formation: parsed.formation || null,
                social_embed_url: parsed.social_embed_url || null,
                poll: parsed.poll || null
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

          // 6. Salva su Supabase
          const { error: insertError } = await supabase
            .from('articles')
            .insert({
              source_id: source.id,
              title: newTitle,
              original_url: item.link,
              image_url: imageUrl,
              ai_summary: aiSummary,
              published_at: finalPublishedAt
            })

          if (insertError) {
            console.error(`Errore inserimento in DB per: ${item.title}`, insertError)
          } else {
            processedCount++;
            recentTitlesList += "\n- " + newTitle;
            
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
                  url: `/?refresh=1`
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
      message: `Elaborazione completata. Nuovi articoli aggiunti: ${processedCount}` 
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


