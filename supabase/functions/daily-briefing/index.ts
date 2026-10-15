import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

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
Includi anche "tweet_text": un recap serale magnetico e completo per X (tra 140 e 210 caratteri, con emoji 🌙🐺🟡🔴, assolutamente SENZA LINK, SENZA URL e SENZA domini web, e SENZA hashtag perché verranno aggiunti dal sistema) che riassuma in pillole dense i temi più importanti della giornata da Trigoria.
Includi anche "dynamic_hashtags": 1-2 hashtag caldi sui temi principali della giornata (es. "#Trigoria #SerieA"), SENZA includere #ASRoma e #RomaFlash.
Restituisci ESCLUSIVAMENTE un JSON con questa struttura:
{
  "excerpt": "Breve frase ad effetto che riassume l'umore generale della giornata (es: 'Giornata frenetica a Trigoria tra infortuni e dichiarazioni infuocate.')",
  "content": "Il testo completo del recap, diviso in paragrafi usando \\n. Includi le notizie più calde raggruppate per argomento.",
  "category": "Il Punto della Giornata",
  "sentiment": "Positivo|Negativo|Neutro",
  "tweet_text": "🌙🐺 Il Punto della Giornata: tutte le notizie chiave di oggi da Trigoria riassunte in 2 minuti! 🟡🔴",
  "dynamic_hashtags": "#SerieA #Trigoria",
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

    const randomBriefingIdx = Math.floor(Math.random() * 3) + 1
    const briefingImageUrl = `/images/daily-briefing/briefing-${randomBriefingIdx}.jpg`

    const briefingArticle = {
      title: `Il Punto della Giornata: ${todayStr}`,
      original_url: `romaflash-daily-briefing-${todayDate}`, // Unique per day
      image_url: briefingImageUrl,
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
      const cleanBase = (aiSummary.tweet_text || `🌙🐺 ${briefingArticle.title}\n\n${aiSummary.excerpt}`)
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/#[a-zA-Z0-9_]+/g, '')
        .trim();
      const extraTags = (aiSummary.dynamic_hashtags || '')
        .replace(/#ASRoma/gi, '')
        .replace(/#RomaFlash/gi, '')
        .trim();
      const footer = `\n\n⚡ RomaFlash  #ASRoma #PuntodellaGiornata${extraTags ? ` ${extraTags}` : ''}`;
      const maxBaseLength = 275 - footer.length;
      const truncatedBase = cleanBase.length > maxBaseLength
        ? cleanBase.substring(0, maxBaseLength - 3).trim() + '...'
        : cleanBase;
      const fullTweet = `${truncatedBase}${footer}`;

      console.log(`[X AUTO-POST] Pubblicazione Punto della Giornata nativo su X...`);
      const xRes = await postToX(fullTweet, briefingImageUrl);
      if (xRes.id) {
        console.log(`[X AUTO-POST] Punto della Giornata pubblicato su X! ID: ${xRes.id}`);
        xTweetId = xRes.id;
        aiSummary.x_tweet_id = xRes.id;
        if (xRes.url) {
          aiSummary.x_tweet_url = xRes.url;
        }
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
