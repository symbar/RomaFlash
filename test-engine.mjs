import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const geminiApiKey = process.env.GEMINI_API_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const genAI = new GoogleGenerativeAI(geminiApiKey)

async function run() {
  console.log("Pulizia vecchi articoli...")
  await supabase.from('articles').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log("Aggiornamento fonti (Uso 2 fonti e processo 5 notizie ciascuna)...")
  const newSources = [
    { name: 'VoceGiallorossa', rss_url: 'https://www.vocegiallorossa.it/rss/', is_active: false },
    { name: 'RomaNews', rss_url: 'https://www.romanews.eu/feed/', is_active: true },
    { name: 'ForzaRoma.info', rss_url: 'https://www.forzaroma.info/feed/', is_active: true },
    { name: 'Giallorossi.net', rss_url: 'https://www.giallorossi.net/feed/', is_active: false }
  ]
  
  for (const src of newSources) {
    await supabase.from('sources').upsert(src, { onConflict: 'rss_url' })
  }

  const { data: sources } = await supabase.from('sources').select('*').eq('is_active', true)
  if (!sources || sources.length === 0) return

  const parser = new Parser()
  let processedCount = 0

  for (const source of sources) {
    console.log(`\nAnalizzando fonte: ${source.name} (${source.rss_url})`)
    try {
      const feed = await parser.parseURL(source.rss_url)
      const items = feed.items.slice(0, 5)

      for (const item of items) {
        if (!item.link || !item.title) continue

        console.log(`Nuova notizia trovata: ${item.title}`)
        let aiSummary = {}
        let newTitle = item.title

        let retries = 3
        while (retries > 0) {
          try {
            const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" })
            const prompt = `Sei un giornalista sportivo esperto dell'AS Roma. 
Il tuo compito è rielaborare completamente questa notizia con uno stile editoriale accattivante.
1. Scrivi un nuovo titolo (diverso dall'originale).
2. Scrivi un breve riassunto di 2 righe (excerpt) per la homepage.
3. Riscrivi l'intero articolo in modo discorsivo, fluido e professionale.

Rispondi SOLO con un oggetto JSON valido con questa struttura esatta:
{"titolo": "Nuovo titolo", "excerpt": "Breve riassunto", "content": "Testo completo dell'articolo riscritto...", "category": "Calciomercato, Infortunio, Dichiarazioni, Partita o Altro", "sentiment": "Positivo, Negativo o Neutro"}
Nessuna formattazione markdown, solo il JSON puro.

Titolo originale: ${item.title}
Contenuto originale: ${item.contentSnippet || item.content || "Nessun contenuto aggiuntivo."}`
            
            const result = await model.generateContent(prompt)
            const textResponse = result.response.text()
            const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(cleanJson)
            
            if (parsed.titolo) newTitle = parsed.titolo
            if (parsed.excerpt && parsed.content) {
              aiSummary = { 
                excerpt: parsed.excerpt, 
                content: parsed.content,
                category: parsed.category || "Altro",
                sentiment: parsed.sentiment || "Neutro"
              }
            }
            else throw new Error("Formato JSON non valido")

            break // Successo, esci dal ciclo dei tentativi
          } catch (e) {
            console.error(`Errore Gemini (tentativi rimasti: ${retries - 1}):`, e.message)
            retries--
            if (retries === 0) {
              aiSummary = ["Riassunto non disponibile per elevato traffico AI."]
            } else {
              // Aspetta 3 secondi prima di riprovare (evita errori 503 e 429)
              await new Promise(res => setTimeout(res, 3000))
            }
          }
        }

        // Aspetta 5 secondi tra una notizia e l'altra per restare sotto i 15 RPM del piano Free di Gemini
        console.log("Attesa 5 secondi per rispettare i limiti API...")
        await new Promise(res => setTimeout(res, 5000))

        // Per ora disabilitiamo l'immagine originale come richiesto
        const imageUrl = null 

        const { error: insertError } = await supabase.from('articles').insert({
          source_id: source.id,
          title: newTitle,
          original_url: item.link,
          image_url: imageUrl,
          ai_summary: aiSummary,
          published_at: item.isoDate || item.pubDate || new Date().toISOString()
        })

        if (!insertError) {
          console.log(`✅ Salvato con successo!`)
          processedCount++
        }
      }
    } catch (feedError) {
      console.error("Errore Feed:", feedError.message)
    }
  }
  console.log(`\nFinito. Aggiunti: ${processedCount}`)
}
run()
