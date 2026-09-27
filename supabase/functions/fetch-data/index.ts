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
    const footballApiKey = Deno.env.get('FOOTBALL_DATA_API_KEY')

    if (!supabaseUrl || !supabaseKey || !footballApiKey) {
      throw new Error("Mancano le credenziali Supabase o API KEY")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Fetch Classifica Serie A
    const standingsRes = await fetch('https://api.football-data.org/v4/competitions/SA/standings', {
      headers: { 'X-Auth-Token': footballApiKey }
    })
    
    if (standingsRes.ok) {
      const standingsJson = await standingsRes.json()
      const table = standingsJson.standings?.[0]?.table || []
      
      if (table.length > 0) {
        // Pulisci vecchia classifica
        await supabase.from('standings').delete().neq('id', -1)
        
        const standingsData = table.map((row: any) => ({
          position: row.position,
          team_name: row.team.shortName || row.team.name,
          team_logo: row.team.crest,
          played: row.playedGames,
          won: row.won,
          draw: row.draw,
          lost: row.lost,
          points: row.points,
          goals_for: row.goalsFor,
          goals_against: row.goalsAgainst,
          updated_at: new Date().toISOString()
        }))
        
        await supabase.from('standings').insert(standingsData)
        console.log("Classifica aggiornata!")
      }
    } else {
      console.error("Errore fetch classifica", await standingsRes.text())
    }

    // 2. Fetch Calendario Roma (solo le prossime o recenti)
    // Prendiamo tutte le partite della stagione in corso (status: SCHEDULED, FINISHED, ecc)
    // team 100 è l'AS Roma
    const matchesRes = await fetch('https://api.football-data.org/v4/teams/100/matches', {
      headers: { 'X-Auth-Token': footballApiKey }
    })

    if (matchesRes.ok) {
      const matchesJson = await matchesRes.json()
      const matches = matchesJson.matches || []
      
      if (matches.length > 0) {
        // Pulisci vecchio calendario
        await supabase.from('calendar_matches').delete().neq('id', -1)
        
        const matchesData = matches.map((m: any) => ({
          api_id: m.id,
          competition: m.competition.name,
          home_team: m.homeTeam.shortName || m.homeTeam.name,
          home_logo: m.homeTeam.crest,
          away_team: m.awayTeam.shortName || m.awayTeam.name,
          away_logo: m.awayTeam.crest,
          match_date: m.utcDate,
          status: m.status,
          score_home: m.score?.fullTime?.home ?? null,
          score_away: m.score?.fullTime?.away ?? null,
          updated_at: new Date().toISOString()
        }))
        
        await supabase.from('calendar_matches').insert(matchesData)
        console.log(`Calendario aggiornato con ${matchesData.length} partite!`)
      }
    } else {
      console.error("Errore fetch calendario", await matchesRes.text())
    }

    return new Response(JSON.stringify({ success: true, message: "Dati aggiornati" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Errore fetch-data:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
