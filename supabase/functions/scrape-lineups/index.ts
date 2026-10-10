
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
                        const name = $(el).find('.player-name span').text().trim() || $(el).find('.player-name').text().trim();
                        const probText = $(el).find('.progress-value').text().trim();
                        const prob = parseInt(probText.replace('%', '')) || 100;
                        const role = $(el).find('.role').attr('data-value') || '-';
                        if (name) {
                            starters.push({ name, prob, role, ballottaggio: prob < 100 });
                        }
                    });

                    cardSelector.find('.player-list.reserves .pill').each((i, el) => {
                        const name = $(el).find('.player-name span').text().trim() || $(el).find('.player-name').text().trim();
                        const probText = $(el).find('.progress-value').text().trim();
                        const prob = parseInt(probText.replace('%', '')) || 0;
                        const role = $(el).find('.role').attr('data-value') || '-';
                        if (name) {
                            bench.push({ name, prob, role, ballottaggio: prob > 0 });
                        }
                    });

                    return { teamName, formation, starters, bench };
                };

                const homeTeamData = parseTeam(homeCard, homeName);
                const awayTeamData = parseTeam(awayCard, awayName);

                // PARSE DETAILS (Injuries, Suspensions, Ballottaggi)
                const details = {};
                ['Ballottaggi', 'Squalificati', 'Diffidati', 'Infortunati', 'In dubbio'].forEach(secName => {
                    let header = $(match).find(`h4:contains("${secName}"), a.label:contains("${secName}")`).last();
                    if (header.length) {
                        let siblingRef = header;
                        if (header[0].tagName === 'a') {
                            siblingRef = header.closest('div');
                        }
                        const nextContents = siblingRef.nextAll('.content');
                        const homeItems = [];
                        const awayItems = [];
                        
                        if (nextContents.length >= 2) {
                            const homeContent = $(nextContents[0]);
                            const awayContent = $(nextContents[1]);
                            
                            if (secName === 'Ballottaggi') {
                               homeContent.find('.ballot').each((i, b) => {
                                   const pair = [];
                                   $(b).find('li.dot').each((j, d) => {
                                       pair.push({
                                           name: $(d).find('.player-name span').text().trim() || $(d).find('.player-name').text().trim(),
                                           prob: parseInt($(d).find('.percentage').text().trim())
                                       });
                                   });
                                   if (pair.length > 0) homeItems.push(pair);
                               });
                               awayContent.find('.ballot').each((i, b) => {
                                   const pair = [];
                                   $(b).find('li.dot').each((j, d) => {
                                       pair.push({
                                           name: $(d).find('.player-name span').text().trim() || $(d).find('.player-name').text().trim(),
                                           prob: parseInt($(d).find('.percentage').text().trim())
                                       });
                                   });
                                   if (pair.length > 0) awayItems.push(pair);
                               });
                            } else {
                               const parseList = (content, items) => {
                                   content.find('li, .empty-list-message').each((i, li) => {
                                       let name = $(li).find('.player-name span').text().trim() || $(li).find('.player-name').text().trim();
                                       let desc = $(li).find('.player-status-note').text().trim() || $(li).find('.description').text().trim() || '';
                                       let text = $(li).text().replace(/\s+/g, ' ').trim();
                                       
                                       if (text && text !== 'Nessun calciatore') {
                                           if (name) {
                                               items.push({ name, desc });
                                           } else {
                                               items.push({ name: text, desc: '' });
                                           }
                                       }
                                   });
                               };
                               parseList(homeContent, homeItems);
                               parseList(awayContent, awayItems);
                            }
                        }
                        details[secName] = { home: homeItems, away: awayItems };
                    }
                });

                teamsData.push({
                    home_team: homeName,
                    away_team: awayName,
                    home_formation: homeTeamData.formation,
                    away_formation: awayTeamData.formation,
                    home_starters: homeTeamData.starters,
                    away_starters: awayTeamData.starters,
                    bench: { home: homeTeamData.bench, away: awayTeamData.bench },
                    details: details
                });
            }
        });

        if (teamsData.length === 0) {
             console.log("Nessuna partita della Roma trovata.");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        for (const data of teamsData) {
            const { error } = await supabase
                .from('lineups')
                .upsert(
                    { 
                        home_team: data.home_team, 
                        away_team: data.away_team, 
                        home_formation: data.home_formation,
                        away_formation: data.away_formation,
                        home_starters: data.home_starters,
                        away_starters: data.away_starters,
                        bench: data.bench,
                        details: data.details,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'home_team,away_team' }
                );

            if (error) {
                console.error("Error upserting:", error);
            } else {
                console.log(`Upserted data for ${data.home_team} vs ${data.away_team}`);
            }
        }

        return new Response(JSON.stringify({ success: true, teamsData }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
