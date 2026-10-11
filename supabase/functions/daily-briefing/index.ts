import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function rfc3986Encode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

async function postToX(tweetText: string): Promise<{ id?: string; error?: string }> {
  const apiKey = Deno.env.get('X_API_KEY')
  const apiSecret = Deno.env.get('X_API_SECRET')
  const accessToken = Deno.env.get('X_ACCESS_TOKEN')
  const accessSecret = Deno.env.get('X_ACCESS_TOKEN_SECRET')

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return { error: 'Credenziali X_API non configurate su Supabase' }
  }

  const url = 'https://api.twitter.com/2/tweets'
  const method = 'POST'
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  }

  const sortedParamStr = Object.keys(oauthParams)
    .sort()
    .map((k) => `${rfc3986Encode(k)}=${rfc3986Encode(oauthParams[k])}`)
    .join('&')

  const baseString = `${method}&${rfc3986Encode(url)}&${rfc3986Encode(sortedParamStr)}`
  const signingKey = `${rfc3986Encode(apiSecret)}&${rfc3986Encode(accessSecret)}`

  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingKey),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(baseString))
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

  oauthParams.oauth_signature = signatureBase64

  const authHeader =
    'OAuth ' +
    Object.keys(oauthParams)
      .sort()
      .map((k) => `${rfc3986Encode(k)}="${rfc3986Encode(oauthParams[k])}"`)
      .join(', ')

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweetText }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Errore API X:', res.status, data)
      return { error: JSON.stringify(data) }
    }
    return { id: data?.data?.id }
  } catch (err: any) {
    console.error('Errore di rete verso X:', err)
    return { error: err?.message || String(err) }
  }
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
Scrivi il briefing giornaliero sia in italiano che in inglese (nell'oggetto "en"). Unisci le notizie correlate, evidenzia le più importanti, usa un tono professionale ma appassionato.
Invece di elencare semplicemente le notizie, crea un vero e proprio "recap" in paragrafi.
Includi anche "tweet_text": un post serale accattivante per X (massimo 175 caratteri, con emoji 🌙🐺🟡🔴 e gli hashtag #ASRoma #RomaFlash, SENZA link perché verrà aggiunto dal sistema).
Restituisci ESCLUSIVAMENTE un JSON con questa struttura:
{
  "excerpt": "Breve frase ad effetto che riassume l'umore generale della giornata (es: 'Giornata frenetica a Trigoria tra infortuni e dichiarazioni infuocate.')",
  "content": "Il testo completo del recap, diviso in paragrafi usando \\n. Includi le notizie più calde raggruppate per argomento.",
  "category": "Il Punto della Giornata",
  "sentiment": "Positivo|Negativo|Neutro",
  "tweet_text": "🌙🐺 Il Punto della Giornata: tutte le notizie chiave di oggi da Trigoria riassunte in 2 minuti! 🟡🔴 #ASRoma #RomaFlash",
  "en": {
    "title": "Daily Briefing: October 11",
    "excerpt": "Short punchy English summary of the day's mood at Trigoria...",
    "content": "Full English daily recap divided into paragraphs using \\n..."
  }
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
    
    let aiSummary: any;
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
    const { data: savedBriefing, error: insertError } = await supabase
      .from('articles')
      .upsert(briefingArticle, { onConflict: 'original_url' })
      .select('id')
      .single()

    if (insertError) {
        throw insertError
    }

    // Auto-Pubblicazione su X (12° slot riservato a Il Punto della Giornata)
    let xTweetId: string | undefined = undefined;
    if (savedBriefing?.id) {
      const articleUrl = `https://romaflash.app/article?id=${savedBriefing.id}`;
      const baseTweet = (aiSummary.tweet_text || `🌙🐺 ${briefingArticle.title}\n\n${aiSummary.excerpt}\n\n#ASRoma #RomaFlash`).trim();
      const fullTweet = `${baseTweet}\n\n📖 Leggi il recap completo:\n👉 ${articleUrl}`;

      console.log(`[X AUTO-POST] Pubblicazione Punto della Giornata su X...`);
      const xRes = await postToX(fullTweet);
      if (xRes.id) {
        console.log(`[X AUTO-POST] Punto della Giornata pubblicato su X! ID: ${xRes.id}`);
        xTweetId = xRes.id;
        aiSummary.x_tweet_id = xRes.id;
        aiSummary.x_posted_at = new Date().toISOString();
        await supabase
          .from('articles')
          .update({ ai_summary: aiSummary })
          .eq('id', savedBriefing.id);
      } else {
        console.error(`[X AUTO-POST] Errore pubblicazione Punto della Giornata su X:`, xRes.error);
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
          title: briefingArticle.title,
          body: "Il mega-riassunto della giornata è online! Leggilo ora.",
          url: savedBriefing?.id ? `/article?id=${savedBriefing.id}` : `/?refresh=1`
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

    return new Response(JSON.stringify({ success: true, message: "Briefing generato con successo.", x_tweet_id: xTweetId }), {
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
