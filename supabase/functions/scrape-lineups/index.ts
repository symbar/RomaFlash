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

        const matches = $('li.match.match-item');
        let recordsToUpsert: any[] = [];

        const buildFactualCommentary = (
            teamName: string,
            formation: string,
            starters: any[],
            ballottaggi: any[],
            infortunati: any[],
            squalificati: any[]
        ): string => {
            if (!starters || starters.length === 0) {
                return "In attesa delle indicazioni ufficiali dai campi di allenamento.";
            }
            const gk = starters.filter(p => p.role.toUpperCase() === 'P').map(p => p.name);
            const defs = starters.filter(p => p.role.toUpperCase() === 'D').map(p => p.name);
            const mids = starters.filter(p => p.role.toUpperCase() === 'C').map(p => p.name);
            const fwds = starters.filter(p => p.role.toUpperCase() === 'A').map(p => p.name);

            const parts: string[] = [];
            parts.push(`${teamName} verso il modulo ${formation}.`);
            if (gk.length > 0 && defs.length > 0) {
                parts.push(`Tra i pali ${gk[0]}, con il reparto arretrato composto da ${defs.join(', ')}.`);
            }
            if (mids.length > 0) {
                parts.push(`In mediana spazio a ${mids.join(', ')}.`);
            }
            if (fwds.length > 0) {
                parts.push(`Nel reparto offensivo pronti ${fwds.join(' e ')}.`);
            }
            if (ballottaggi && ballottaggi.length > 0) {
                const bStrings = ballottaggi
                    .filter((pair: any) => pair && pair.length >= 2)
                    .map((pair: any) => `${pair[0].name} (${pair[0].prob}%) - ${pair[1].name} (${pair[1].prob}%)`);
                if (bStrings.length > 0) {
                    parts.push(`Ballottaggi aperti: ${bStrings.join('; ')}.`);
                }
            }
            const outNames = [
                ...(squalificati || []).map((x: any) => x.name),
                ...(infortunati || []).map((x: any) => x.name),
            ].filter(Boolean);
            if (outNames.length > 0) {
                parts.push(`Indisponibili: ${outNames.join(', ')}.`);
            }
            return parts.join(' ');
        };

        matches.each((i, match) => {
            const homeName = $(match).find("label.team-home meta[itemprop='name']").attr("content");
            const awayName = $(match).find("label.team-away meta[itemprop='name']").attr("content");

            if (homeName === "Roma" || awayName === "Roma") {
                const homeCard = $(match).find('.card.team-card').eq(0);
                const awayCard = $(match).find('.card.team-card').eq(1);

                const parseTeam = (cardSelector: any, teamName: string) => {
                    const starters: any[] = [];
                    const bench: any[] = [];
                    
                    const formationText = cardSelector.text().replace(/\s+/g, ' ');
                    const formationMatch = formationText.match(/\d-\d-\d-\d|\d-\d-\d/);
                    const formation = formationMatch ? formationMatch[0] : "N/A";

                    cardSelector.find('.player-list.starters .pill').each((i: number, el: any) => {
                        const name = $(el).find('.player-name span').text().trim() || $(el).find('.player-name').text().trim();
                        const probText = $(el).find('.progress-value').text().trim();
                        const prob = parseInt(probText.replace('%', '')) || 100;
                        const role = ($(el).find('.role').attr('data-value') || '-').toUpperCase();
                        if (name) {
                            starters.push({ name, prob, role, ballottaggio: prob < 100 });
                        }
                    });

                    cardSelector.find('.player-list.reserves .pill').each((i: number, el: any) => {
                        const name = $(el).find('.player-name span').text().trim() || $(el).find('.player-name').text().trim();
                        const probText = $(el).find('.progress-value').text().trim();
                        const prob = parseInt(probText.replace('%', '')) || 0;
                        const role = ($(el).find('.role').attr('data-value') || '-').toUpperCase();
                        if (name) {
                            bench.push({ name, prob, role, ballottaggio: prob > 0 });
                        }
                    });

                    return { teamName, formation, starters, bench };
                };

                const homeTeamData = parseTeam(homeCard, homeName || "");
                const awayTeamData = parseTeam(awayCard, awayName || "");

                // PARSE DETAILS (Injuries, Suspensions, Ballottaggi)
                const details: any = {};
                ['Ballottaggi', 'Squalificati', 'Diffidati', 'Infortunati', 'In dubbio'].forEach(secName => {
                    let header = $(match).find(`h4:contains("${secName}"), a.label:contains("${secName}")`).last();
                    if (header.length) {
                        let siblingRef = header;
                        if (header[0].tagName === 'a') {
                            siblingRef = header.closest('div');
                        }
                        const nextContents = siblingRef.nextAll('.content');
                        const homeItems: any[] = [];
                        const awayItems: any[] = [];
                        
                        if (nextContents.length >= 2) {
                            const homeContent = $(nextContents[0]);
                            const awayContent = $(nextContents[1]);
                            
                            if (secName === 'Ballottaggi') {
                               homeContent.find('.ballot').each((i: number, b: any) => {
                                   const pair: any[] = [];
                                   $(b).find('li.dot').each((j: number, d: any) => {
                                       pair.push({
                                           name: $(d).find('.player-name span').text().trim() || $(d).find('.player-name').text().trim(),
                                           prob: parseInt($(d).find('.percentage').text().trim())
                                       });
                                   });
                                   if (pair.length > 0) homeItems.push(pair);
                               });
                               awayContent.find('.ballot').each((i: number, b: any) => {
                                   const pair: any[] = [];
                                   $(b).find('li.dot').each((j: number, d: any) => {
                                       pair.push({
                                           name: $(d).find('.player-name span').text().trim() || $(d).find('.player-name').text().trim(),
                                           prob: parseInt($(d).find('.percentage').text().trim())
                                       });
                                   });
                                   if (pair.length > 0) awayItems.push(pair);
                               });
                            } else {
                               const parseList = (content: any, items: any[]) => {
                                   content.find('li, .empty-list-message').each((i: number, li: any) => {
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

                const matchDate = $(match).find('.match-info .match-date').text().replace(/\s+/g, ' ').trim();
                const matchStadium = $(match).find('.match-info .match-stadium').text().replace(/\s+/g, ' ').trim();

                // PARSE PRESENTAZIONE SQUADRE (Commentary)
                let homeCommentary = "";
                let awayCommentary = "";
                $(match).find('.match-comment .col').each((i: number, col: any) => {
                    const colTeam = $(col).find('h4').text().trim();
                    const comment = ($(col).find('.comment p').text() || $(col).find('.comment').text()).replace(/\s+/g, ' ').trim();
                    if (comment && comment.toLowerCase() !== 'nessuna notizia') {
                        if (colTeam === homeName) homeCommentary = comment;
                        if (colTeam === awayName) awayCommentary = comment;
                    }
                });

                if (!homeCommentary) {
                    homeCommentary = buildFactualCommentary(
                        homeName || "",
                        homeTeamData.formation,
                        homeTeamData.starters,
                        details.Ballottaggi?.home || [],
                        details.Infortunati?.home || [],
                        details.Squalificati?.home || []
                    );
                }
                if (!awayCommentary) {
                    awayCommentary = buildFactualCommentary(
                        awayName || "",
                        awayTeamData.formation,
                        awayTeamData.starters,
                        details.Ballottaggi?.away || [],
                        details.Infortunati?.away || [],
                        details.Squalificati?.away || []
                    );
                }

                const match_name = `${homeName} - ${awayName}`;

                recordsToUpsert.push({
                    team: homeName,
                    match_name: match_name,
                    formation: homeTeamData.formation,
                    starters: homeTeamData.starters,
                    bench: homeTeamData.bench,
                    details: {
                        commentary: homeCommentary,
                        match_date: matchDate,
                        match_stadium: matchStadium,
                        Ballottaggi: details.Ballottaggi?.home || [],
                        Squalificati: details.Squalificati?.home || [],
                        Diffidati: details.Diffidati?.home || [],
                        Infortunati: details.Infortunati?.home || [],
                        "In dubbio": details["In dubbio"]?.home || []
                    },
                    updated_at: new Date().toISOString()
                });

                recordsToUpsert.push({
                    team: awayName,
                    match_name: match_name,
                    formation: awayTeamData.formation,
                    starters: awayTeamData.starters,
                    bench: awayTeamData.bench,
                    details: {
                        commentary: awayCommentary,
                        match_date: matchDate,
                        match_stadium: matchStadium,
                        Ballottaggi: details.Ballottaggi?.away || [],
                        Squalificati: details.Squalificati?.away || [],
                        Diffidati: details.Diffidati?.away || [],
                        Infortunati: details.Infortunati?.away || [],
                        "In dubbio": details["In dubbio"]?.away || []
                    },
                    updated_at: new Date().toISOString()
                });
            }
        });

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        for (const record of recordsToUpsert) {
            const { error } = await supabase
                .from('lineups')
                .upsert(record, { onConflict: 'team' });

            if (error) {
                console.error(`Error upserting ${record.team}:`, error);
            } else {
                console.log(`Successfully upserted ${record.team}`);
            }
        }

        return new Response(JSON.stringify({ success: true, count: recordsToUpsert.length }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
    }
});
