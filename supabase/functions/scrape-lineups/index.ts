
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
    try {
        const url = "https://www.fantacalcio.it/probabili-formazioni-serie-a";
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const matches = $('ul.match-list > li.match');
        let teamsData = [];

        matches.each((i, match) => {
            const homeName = $(match).find("label.team-home meta[itemprop='name']").attr("content");
            const awayName = $(match).find("label.team-away meta[itemprop='name']").attr("content");

            if (homeName === "Roma" || awayName === "Roma") {
                const homeCard = $(match).find('.card.team-card').eq(0);
                const awayCard = $(match).find('.card.team-card').eq(1);

                const parseTeam = (cardSelector, teamName) => {
                    const starters = [];
                    const bench = [];
                    
                    const formationText = cardSelector.text().replace(/\s+/g, ' ');
                    const formationMatch = formationText.match(/\d-\d-\d-\d|\d-\d-\d/);
                    const formation = formationMatch ? formationMatch[0] : "N/A";

                    cardSelector.find('.player-list.starters .pill').each((i, el) => {
                        const name = $(el).find('.player-name span').text().trim();
                        const probText = $(el).find('.progress-value').text().trim();
                        const prob = parseInt(probText.replace('%', '')) || 100;
                        const role = $(el).find('.role').attr('data-value') || '-';
                        if (name) {
                            starters.push({ name, prob, role, ballottaggio: prob < 100 });
                        }
                    });

                    cardSelector.find('.player-list.reserves .pill').each((i, el) => {
                        const name = $(el).find('.player-name span').text().trim();
                        const probText = $(el).find('.progress-value').text().trim();
                        const prob = parseInt(probText.replace('%', '')) || 100;
                        const role = $(el).find('.role').attr('data-value') || '-';
                        if (name) {
                            bench.push({ name, prob, role, ballottaggio: prob < 100 });
                        }
                    });

                    teamsData.push({
                        team: teamName,
                        match_name: `${homeName} - ${awayName}`,
                        formation: formation,
                        starters: starters,
                        bench: bench,
                        updated_at: new Date().toISOString()
                    });
                };

                parseTeam(homeCard, homeName);
                parseTeam(awayCard, awayName);
            }
        });

        if (teamsData.length === 0) {
            return new Response(JSON.stringify({ error: "Partita della Roma non trovata." }), {
                headers: { 'Content-Type': 'application/json' },
                status: 404,
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        for (const t of teamsData) {
            const { error } = await supabase
                .from('lineups')
                .upsert(
                    { 
                        team: t.team, 
                        match_name: t.match_name, 
                        formation: t.formation, 
                        starters: t.starters, 
                        bench: t.bench,
                        updated_at: t.updated_at 
                    },
                    { onConflict: 'team' }
                );
            if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true, data: teamsData }), {
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
