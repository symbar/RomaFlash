import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import Parser from "https://esm.sh/rss-parser@3.13.0"

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

    const parser = new Parser()
    let processedCount = 0

    // 3. Itera su ogni fonte
    for (const source of sources) {
      console.log(`Analizzando fonte: ${source.name} (${source.rss_url})`)
      
      try {
        const feed = await parser.parseURL(source.rss_url)
        
        // Prendiamo solo le ultime 5 notizie per evitare di sovraccaricare l'API al primo avvio
        const items = feed.items.slice(0, 5)

        for (const item of items) {
          if (!item.link || !item.title) continue;

          // Controlla se la notizia esiste già nel DB
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

          // 4. Chiama Gemini per il riassunto
          const prompt = `Sei un giornalista sportivo esperto dell'AS Roma. 
Il tuo compito è rielaborare completamente questa notizia con uno stile editoriale accattivante.
1. Scrivi un nuovo titolo (diverso dall'originale).
2. Scrivi un breve riassunto di 2 righe (excerpt) per la homepage.
3. Riscrivi l'intero articolo in modo discorsivo, fluido e professionale.

Rispondi SOLO con un oggetto JSON valido con questa struttura esatta:
{"titolo": "Nuovo titolo", "excerpt": "Breve riassunto", "content": "Testo completo dell'articolo riscritto..."}
Nessuna formattazione markdown, solo il JSON puro.

Titolo originale: ${item.title}
Contenuto originale: ${item.contentSnippet || item.content || "Nessun contenuto aggiuntivo."}`

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

            if (parsed.titolo) newTitle = parsed.titolo
            if (parsed.excerpt && parsed.content) {
              aiSummary = { excerpt: parsed.excerpt, content: parsed.content }
            }
          } catch (e) {
            console.error("Errore nel parsing della risposta di Gemini:", e, geminiData)
            aiSummary = { excerpt: "Riassunto non disponibile.", content: "Articolo non disponibile." }
          }

          // Per ora disabilitiamo l'immagine originale come richiesto
          const imageUrl = null

          // 5. Salva su Supabase
          const { error: insertError } = await supabase
            .from('articles')
            .insert({
              source_id: source.id,
              title: newTitle,
              original_url: item.link,
              image_url: imageUrl,
              ai_summary: aiSummary,
              published_at: item.isoDate || item.pubDate || new Date().toISOString()
            })

          if (insertError) {
            console.error(`Errore inserimento in DB per: ${item.title}`, insertError)
          } else {
            processedCount++
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
