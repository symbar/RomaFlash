import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Mancano le credenziali Supabase (URL o SERVICE_ROLE_KEY)")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const footballApiKey = Deno.env.get('FOOTBALL_DATA_API_KEY')

    if (!footballApiKey) {
      throw new Error("Manca la FOOTBALL_DATA_API_KEY")
    }

    // ID della Roma su football-data.org è 100
    const url = 'https://api.football-data.org/v4/teams/100/matches?status=SCHEDULED&limit=1'
    const res = await fetch(url, {
      headers: {
        'X-Auth-Token': footballApiKey
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Errore API football-data: ${res.status} ${errorText}`)
    }

    const json = await res.json()

    if (!json.matches || json.matches.length === 0) {
      return new Response(JSON.stringify({ message: "Nessuna partita futura trovata per la Roma." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const match = json.matches[0]
    
    const nextMatchData = {
      home_team: match.homeTeam.shortName || match.homeTeam.name,
      away_team: match.awayTeam.shortName || match.awayTeam.name,
      competition: match.competition.name,
      match_date: match.utcDate,
      updated_at: new Date().toISOString()
    }

    // Puliamo la tabella e inseriamo la nuova (ne teniamo solo 1 in cache)
    await supabase.from('next_match').delete().neq('id', -1)
    
    const { error: insertError } = await supabase
      .from('next_match')
      .insert(nextMatchData)

    if (insertError) {
      throw insertError
    }

    return new Response(JSON.stringify({ success: true, match: nextMatchData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Errore fetch-match:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
