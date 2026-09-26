import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY non configurata")

    // 1. Recupera gli articoli delle ultime 24 ore
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('title, ai_summary')
      .gte('published_at', twentyFourHoursAgo)
      // Exclude existing daily briefings to avoid loop
      .not('original_url', 'like', 'romaflash-daily-briefing-%')
    
    if (articlesError) throw articlesError

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ message: "Nessun articolo nelle ultime 24 ore." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Trovati ${articles.length} articoli per il briefing giornaliero.`)

    // Prepara il prompt
    const articlesContext = articles.map(a => `- ${a.title}: ${a.ai_summary?.excerpt || ''}`).join('\n')

    const prompt = `
Sei il caporedattore di RomaFlash, l'aggregatore definitivo di notizie sull'AS Roma.
Il tuo compito è scrivere "Il Punto della Giornata", una mega-newsletter riassuntiva che esce ogni sera.

Ecco le notizie principali delle ultime 24 ore:
${articlesContext}

Istruzioni per l'output JSON:
Scrivi il briefing giornaliero in italiano. Unisci le notizie correlate, evidenzia le più importanti, usa un tono professionale ma appassionato.
Invece di elencare semplicemente le notizie, crea un vero e proprio "recap" in paragrafi.
Restituisci ESCLUSIVAMENTE un JSON con questa struttura:
{
  "excerpt": "Breve frase ad effetto che riassume l'umore generale della giornata (es: 'Giornata frenetica a Trigoria tra infortuni e dichiarazioni infuocate.')",
  "content": "Il testo completo del recap, diviso in paragrafi usando \\n. Includi le notizie più calde raggruppate per argomento.",
  "category": "Il Punto della Giornata",
  "sentiment": "Positivo|Negativo|Neutro" (Scegli quello predominante per la giornata)
}
Non usare Markdown attorno al JSON (\`\`\`json), restituisci il testo puro.
`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
        }
      })
    })

    const data = await response.json()
    if (!response.ok) {
        throw new Error(`Gemini API error: ${JSON.stringify(data)}`)
    }

    let resultText = data.candidates[0].content.parts[0].text
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim()
    
    let aiSummary;
    try {
        aiSummary = JSON.parse(resultText)
    } catch (e) {
        console.error("Failed to parse Gemini output:", resultText)
        throw new Error("Invalid JSON from Gemini")
    }

    const todayStr = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long' }).format(new Date())
    const todayDate = new Date().toISOString().split('T')[0]

    const briefingArticle = {
      title: `Il Punto della Giornata: ${todayStr}`,
      original_url: `romaflash-daily-briefing-${todayDate}`, // Unique per day
      published_at: new Date().toISOString(),
      ai_summary: aiSummary,
      source_id: "cde49479-7a5f-4a37-b4d6-cd8c6e0821d6" // Fallback
    }
    
    // Get a source ID to satisfy foreign key constraints (we can use any active source)
    const { data: sources } = await supabase.from('sources').select('id').limit(1).single()
    if (sources) {
        briefingArticle.source_id = sources.id
    }

    // Insert or update (upsert by original_url if it exists)
    const { error: insertError } = await supabase
      .from('articles')
      .upsert(briefingArticle, { onConflict: 'original_url' })

    if (insertError) {
        throw insertError
    }

    // Invia notifica push
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
    
    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails('mailto:hello@romaflash.com', vapidPublic, vapidPrivate)
      
      const { data: subs } = await supabase.from('push_subscriptions').select('*')
      if (subs && subs.length > 0) {
        const payload = JSON.stringify({
          title: briefingArticle.title,
          body: "Il mega-riassunto della giornata è online! Leggilo ora.",
          url: `/?refresh=1`
        })
        
        console.log(`Invio notifica a ${subs.length} iscritti per il Daily Briefing...`)
        for (const sub of subs) {
          try {
            await webpush.sendNotification(sub.subscription, payload)
          } catch (e) {
            console.error('Errore invio push a utente (potrebbe essersi disiscritto):', e)
            if (e.statusCode === 410) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id)
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Briefing generato con successo." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(JSON.stringify({ error: error.message || error.toString() }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
