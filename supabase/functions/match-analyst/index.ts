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

interface CompletedMatchCandidate {
  league: string
  eventId: string
  name: string
  date: string
  completed: boolean
}

async function findLatestCompletedRomaMatch(): Promise<CompletedMatchCandidate | null> {
  const leagues = ['ita.1', 'uefa.champions', 'uefa.europa', 'ita.coppa_italia']
  const completedMatches: CompletedMatchCandidate[] = []

  for (const league of leagues) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/104/schedule`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      })
      if (!res.ok) continue

      const data = await res.json()
      const events = data.events || []

      for (const ev of events) {
        const comp = ev.competitions?.[0]
        const isCompleted = comp?.status?.type?.completed === true
        if (isCompleted && ev.id) {
          completedMatches.push({
            league,
            eventId: ev.id,
            name: ev.name || `${comp?.competitors?.[0]?.team?.name} vs ${comp?.competitors?.[1]?.team?.name}`,
            date: ev.date || comp?.date || new Date().toISOString(),
            completed: true
          })
        }
      }
    } catch (e) {
      console.warn(`Errore fetch schedule per league ${league}:`, e)
    }
  }

  if (completedMatches.length === 0) return null

  // Sort descending by date (most recent first)
  completedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return completedMatches[0]
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

    // Optional manual force event ID via request body (e.g. for testing)
    let forcedEventId: string | null = null
    let forcedLeague: string = 'ita.1'
    try {
      const body = await req.json()
      if (body?.event_id) forcedEventId = String(body.event_id)
      if (body?.league) forcedLeague = String(body.league)
    } catch {
      // empty body is expected for cron
    }

    let targetMatch: CompletedMatchCandidate | null = null
    if (forcedEventId) {
      targetMatch = {
        league: forcedLeague,
        eventId: forcedEventId,
        name: 'Partita Selezionata',
        date: new Date().toISOString(),
        completed: true
      }
    } else {
      targetMatch = await findLatestCompletedRomaMatch()
    }

    if (!targetMatch) {
      return new Response(JSON.stringify({ message: "Nessuna partita della Roma completata trovata." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const originalUrlKey = `romaflash-analyst-match-${targetMatch.eventId}`

    // 1. Check if analysis for this exact match was already generated
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id, title, published_at')
      .eq('original_url', originalUrlKey)
      .maybeSingle()

    if (existingArticle && !forcedEventId) {
      return new Response(JSON.stringify({
        success: true,
        message: "Analisi post-partita de 'L'Analista' già pubblicata per questo match.",
        article_id: existingArticle.id,
        match: targetMatch.name
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Fetch match summary from ESPN
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${targetMatch.league}/summary?event=${targetMatch.eventId}`
    const summaryRes = await fetch(summaryUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    })

    if (!summaryRes.ok) {
      throw new Error(`Impossibile recuperare statistiche ESPN per event ${targetMatch.eventId} (status: ${summaryRes.status})`)
    }

    const summaryData = await summaryRes.json()
    const header = summaryData.header
    const boxscore = summaryData.boxscore

    const teams = boxscore?.teams || []
    if (teams.length < 2) {
      throw new Error("Boxscore ESPN incompleto o squadre non disponibili.")
    }

    const homeTeam = teams[0]
    const awayTeam = teams[1]

    const formatStats = (team: any) => {
      const statsObj: Record<string, string> = {}
      team.statistics?.forEach((s: any) => {
        if (s.label && s.displayValue !== undefined) {
          statsObj[s.label] = s.displayValue
        }
      })
      return statsObj
    }

    const homeStats = formatStats(homeTeam)
    const awayStats = formatStats(awayTeam)

    const homeName = homeTeam.team?.name || 'Squadra Casa'
    const awayName = awayTeam.team?.name || 'Squadra Trasferta'
    const homeScore = homeTeam.score || header?.competitions?.[0]?.competitors?.[0]?.score || '0'
    const awayScore = awayTeam.score || header?.competitions?.[0]?.competitors?.[1]?.score || '0'
    const competitionName = header?.league?.name || 'Serie A'

    // Formatta la scheda statistiche per il prompt
    const statsContext = `
Competizione: ${competitionName}
Partita: ${homeName} (squadra di CASA) ${homeScore} - ${awayScore} ${awayName} (squadra in TRASFERTA)
Sede del match: campo/stadio di ${homeName}

STATISTICHE ${homeName} (CASA):
- Possesso palla: ${homeStats['Possession'] || homeStats['possession'] || 'N/D'}%
- Tiri totali: ${homeStats['SHOTS'] || homeStats['shots'] || 'N/D'}
- Tiri in porta: ${homeStats['ON GOAL'] || homeStats['shotsOnTarget'] || 'N/D'}
- Passaggi riusciti: ${homeStats['Accurate Passes'] || 'N/D'} / ${homeStats['Passes'] || 'N/D'} (${Math.round(Number(homeStats['Pass Completion %'] || 0) * 100)}%)
- Contrasti/Tackle vinti: ${homeStats['Effective Tackles'] || 'N/D'} su ${homeStats['Tackles'] || 'N/D'}
- Palle intercettate: ${homeStats['Interceptions'] || 'N/D'}
- Respinte difensive: ${homeStats['Effective Clearances'] || 'N/D'}
- Calci d'angolo: ${homeStats['Corner Kicks'] || 'N/D'}
- Falli: ${homeStats['Fouls'] || 'N/D'}
- Parate del portiere: ${homeStats['Saves'] || 'N/D'}

STATISTICHE ${awayName} (TRASFERTA):
- Possesso palla: ${awayStats['Possession'] || awayStats['possession'] || 'N/D'}%
- Tiri totali: ${awayStats['SHOTS'] || awayStats['shots'] || 'N/D'}
- Tiri in porta: ${awayStats['ON GOAL'] || awayStats['shotsOnTarget'] || 'N/D'}
- Passaggi riusciti: ${awayStats['Accurate Passes'] || 'N/D'} / ${awayStats['Passes'] || 'N/D'} (${Math.round(Number(awayStats['Pass Completion %'] || 0) * 100)}%)
- Contrasti/Tackle vinti: ${awayStats['Effective Tackles'] || 'N/D'} su ${awayStats['Tackles'] || 'N/D'}
- Palle intercettate: ${awayStats['Interceptions'] || 'N/D'}
- Respinte difensive: ${awayStats['Effective Clearances'] || 'N/D'}
- Calci d'angolo: ${awayStats['Corner Kicks'] || 'N/D'}
- Falli: ${awayStats['Fouls'] || 'N/D'}
- Parate del portiere: ${awayStats['Saves'] || 'N/D'}
`

    const prompt = `
Sei "L'Analista" di RomaFlash, il match analyst ufficiale dell'app di riferimento dell'AS Roma.
Il tuo compito è scrivere la rubrica editoriale post-partita "L'Analista | La Lavagna Tattica".
Usa un tono competente, lucido, appassionato ma rigoroso e analitico (stile The Athletic e L'Ultimo Uomo). Niente lamentele arbitrali o frasi fatte da bar sport: analizza COSA dicono i numeri e le scelte sul campo.

IMPORTANTE SUL FATTORE CAMPO:
La partita si è giocata nello stadio di ${homeName} (squadra di casa). ${awayName} ha giocato in trasferta.
NON usare espressioni che alludano allo stadio della squadra ospite (es. NON scrivere "la legge del Bernabéu" se il Real Madrid è ospite della Roma all'Olimpico). Rispetta rigorosamente chi gioca in casa e chi fuori.

Ecco i dati reali e ufficiali del match appena terminato:
${statsContext}

Istruzioni per l'output:
1. "title": Un titolo accattivante e professionale che inizi con "L'Analista | [Nome Partita Risultato]: [frase che riassume la chiave tattica]" (es: "L'Analista | Roma-Fiorentina 1-0: il dominio del possesso e la diga a centrocampo"). Non menzionare mai lo stadio della squadra ospite.
2. "excerpt": Breve sintesi d'impatto di 2 frasi sui numeri e sul piano gara.
3. "content": Articolo completo organizzato rigorosamente con questi 4 paragrafi ben distinti, usando i grassetti per i sottotitoli:
   - **Il Verdetto dei Numeri**: I dati salienti della sfida (possesso palla, tiri nello specchio, precisione dei passaggi e contrasti) spiegati nel loro significato tattico.
   - **La Chiave Tattica**: Dove si è decisa la gara (pressione alta, corsie esterne, duelli individuali, compattezza tra i reparti).
   - **L'Impatto Statistico**: Quale reparto o dinamica di gioco ha spostato gli equilibri numerici.
   - **Promossi & Da Rivedere**: Sintesi tecnica finale con i punti di forza confermati e gli aspetti da registrare.
4. "sentiment": "Positivo" | "Negativo" | "Neutro" (in base alla prestazione della Roma e al risultato).
5. "category": "L'Analista"
6. "tweet_text": Un post serale/post-gara incisivo per X (massimo 160 caratteri, con emoji 📊♟️🟡🔴, SENZA hashtag e SENZA link).
7. "dynamic_hashtags": 2 hashtag caldi sulla partita (es. "#RomaFiorentina #SerieA" o "#ChampionsLeague #Gasperini"), SENZA #ASRoma e #RomaFlash.
8. "en": Versione inglese completa con gli stessi 4 paragrafi in "content", "title" ("The Analyst | ...") e "excerpt".

Restituisci ESCLUSIVAMENTE un JSON valido senza blocchi markdown (\`\`\`json):
{
  "title": "...",
  "excerpt": "...",
  "content": "...",
  "category": "L'Analista",
  "sentiment": "Positivo",
  "tweet_text": "...",
  "dynamic_hashtags": "...",
  "en": {
    "title": "...",
    "excerpt": "...",
    "content": "..."
  }
}
`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.65,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2500,
        }
      })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(`Gemini API error: ${JSON.stringify(data)}`)
    }

    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim()

    let aiSummary: any
    try {
      aiSummary = JSON.parse(resultText)
    } catch {
      console.error("Failed to parse Gemini output:", resultText)
      throw new Error("Invalid JSON from Gemini")
    }

    const homeLogo = homeTeam.team?.logos?.[0]?.href || (homeTeam.team?.id ? `https://a.espncdn.com/i/teamlogos/soccer/500/${homeTeam.team.id}.png` : 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png')
    const awayLogo = awayTeam.team?.logos?.[0]?.href || (awayTeam.team?.id ? `https://a.espncdn.com/i/teamlogos/soccer/500/${awayTeam.team.id}.png` : 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png')

    aiSummary.match_info = {
      home_name: homeName,
      away_name: awayName,
      home_score: homeScore,
      away_score: awayScore,
      home_logo: homeLogo,
      away_logo: awayLogo,
      competition: competitionName,
      event_id: targetMatch.eventId,
    }

    const articleTitle = aiSummary.title || `L'Analista | ${homeName} ${homeScore}-${awayScore} ${awayName}`
    const tacticalBoardImg = `/images/analista/lavagna-tattica.jpg`

    const articleRecord = {
      title: articleTitle,
      original_url: originalUrlKey,
      image_url: tacticalBoardImg,
      published_at: new Date().toISOString(),
      ai_summary: aiSummary,
      source_id: "cde49479-7a5f-4a37-b4d6-cd8c6e0821d6"
    }

    // Get any valid source to satisfy foreign key
    const { data: sources } = await supabase.from('sources').select('id').limit(1).single()
    if (sources) {
      articleRecord.source_id = sources.id
    }

    // Insert or update article
    const { data: savedArticle, error: insertError } = await supabase
      .from('articles')
      .upsert(articleRecord, { onConflict: 'original_url' })
      .select('id')
      .single()

    if (insertError) {
      throw insertError
    }

    // Auto-Post su X tramite Buffer
    let xTweetId: string | undefined = undefined
    if (savedArticle?.id) {
      const articleUrl = `https://romaflash.app/article?id=${savedArticle.id}`
      const cleanBase = (aiSummary.tweet_text || `📊♟️ ${articleTitle}\n\n${aiSummary.excerpt}`)
        .replace(/#[a-zA-Z0-9_]+/g, '')
        .trim()
      const extraTags = (aiSummary.dynamic_hashtags || '')
        .replace(/#ASRoma/gi, '')
        .replace(/#RomaFlash/gi, '')
        .trim()
      const hashtagsLine = extraTags ? `#ASRoma #RomaFlash ${extraTags}` : `#ASRoma #RomaFlash`
      
      const linkLine = `\n\n📋 Analisi tattica: ${articleUrl}`
      const tagsLine = `\n\n${hashtagsLine}`
      const maxBaseLength = 275 - linkLine.length - tagsLine.length
      const truncatedBase = cleanBase.length > maxBaseLength 
        ? cleanBase.substring(0, maxBaseLength - 3).trim() + '...' 
        : cleanBase
      const fullTweet = `${truncatedBase}${linkLine}${tagsLine}`

      console.log(`[X AUTO-POST] Pubblicazione L'Analista su X...`)
      const xRes = await postToX(fullTweet, tacticalBoardImg)
      if (xRes.id) {
        console.log(`[X AUTO-POST] Articolo L'Analista pubblicato su X! ID: ${xRes.id}`)
        xTweetId = xRes.id
        aiSummary.x_tweet_id = xRes.id
        if (xRes.url) {
          aiSummary.x_tweet_url = xRes.url
        }
        aiSummary.x_posted_at = new Date().toISOString()
        await supabase
          .from('articles')
          .update({ ai_summary: aiSummary })
          .eq('id', savedArticle.id)
      } else {
        console.error(`[X AUTO-POST] Errore pubblicazione L'Analista su X:`, xRes.error)
      }
    }

    // Invia Web Push ai tifosi iscritti
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')

    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails('mailto:hello@romaflash.com', vapidPublic, vapidPrivate)
      const { data: subs } = await supabase.from('push_subscriptions').select('*')
      if (subs && subs.length > 0) {
        const payload = JSON.stringify({
          title: `📊 L'Analista | ${homeName}-${awayName}`,
          body: "Il report tattico post-partita con tutti i numeri del match è online!",
          url: savedArticle?.id ? `/article?id=${savedArticle.id}` : `/?refresh=1`
        })

        console.log(`Invio notifica a ${subs.length} iscritti per L'Analista...`)
        for (const sub of subs) {
          try {
            await webpush.sendNotification(sub.subscription, payload)
          } catch (e: any) {
            if (e?.statusCode === 410) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id)
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Analisi post-partita de 'L'Analista' generata e pubblicata con successo.",
      article_id: savedArticle?.id,
      x_tweet_id: xTweetId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Edge Function error:', error)
    return new Response(JSON.stringify({ error: error.message || error.toString() }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
