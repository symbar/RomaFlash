import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Configurazione variabili d'ambiente (iniettate automaticamente da Supabase)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
    try {
        const url = "https://www.fantacalcio.it/probabili-formazioni-serie-a";
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const matches = $('ul.match-list > li.match');
        let romaData = null;

        matches.each((i, match) => {
            const homeName = $(match).find("label.team-home meta[itemprop='name']").attr("content");
            const awayName = $(match).find("label.team-away meta[itemprop='name']").attr("content");

            if (homeName === "Roma" || awayName === "Roma") {
                const isHome = homeName === "Roma";
                const teamSelector = isHome ? "div.pitch div.team-home" : "div.pitch div.team-away";
                const romaDiv = $(match).find(teamSelector);

                const formation = romaDiv.attr("data-team-formation") || "N/A";

                const starters: string[] = [];
                romaDiv.find('.player .player-name').each((i, el) => {
                    const name = $(el).text().trim();
                    if (name && !starters.includes(name)) {
                        starters.push(name);
                    }
                });

                romaData = {
                    team: "Roma",
                    match_name: `${homeName} - ${awayName}`,
                    formation: formation,
                    starters: starters,
                    updated_at: new Date().toISOString()
                };
            }
        });

        if (!romaData) {
            return new Response(JSON.stringify({ error: "Partita della Roma non trovata." }), {
                headers: { 'Content-Type': 'application/json' },
                status: 404,
            });
        }

        // Bypassa le RLS per scrivere direttamente a DB da Edge Function
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Inseriamo o aggiorniamo i dati nella tabella 'lineups'
        const { error } = await supabase
            .from('lineups')
            .upsert(
                { 
                    team: romaData.team, 
                    match_name: romaData.match_name, 
                    formation: romaData.formation, 
                    starters: romaData.starters, 
                    updated_at: romaData.updated_at 
                },
                { onConflict: 'team' } // Assumendo che 'team' sia Unique/Primary Key
            );

        if (error) {
            throw error;
        }

        return new Response(JSON.stringify({ success: true, data: romaData }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Errore nello scraping:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
})
