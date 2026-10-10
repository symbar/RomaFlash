const cheerio = require('cheerio');

async function getRomaProbableLineup() {
    const url = "https://www.fantacalcio.it/probabili-formazioni-serie-a";
    
    try {
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
                
                // Titolari
                const starters = [];
                romaDiv.find('.player .player-name').each((i, el) => {
                    const name = $(el).text().trim();
                    if (name && !starters.includes(name)) {
                        starters.push(name);
                    }
                });

                // Per info extra (ballottaggi, infortunati) di solito sono in liste separate
                // proviamo a prendere anche quelli se troviamo le sezioni.
                const extraInfo = {};
                $(match).find('.match-info .info-block').each((i, el) => {
                    const title = $(el).find('h4').text().trim();
                    // ... parsing extra info logic ...
                });
                
                romaData = {
                    team: "Roma",
                    match: `${homeName} vs ${awayName}`,
                    formation: formation,
                    starters: starters,
                };
            }
        });
        
        return romaData || { error: "Partita della Roma non trovata." };
        
    } catch (error) {
        console.error("Errore nello scraping:", error);
        return { error: error.message };
    }
}

// Esegue lo script
getRomaProbableLineup().then(data => {
    console.log(JSON.stringify(data, null, 2));
});
