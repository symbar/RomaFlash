# Roadmap di Sviluppo: RomaFlash PWA 🐺

> [!NOTE]
> Questa roadmap include **esclusivamente le funzionalità aperte e le nuove idee strategiche** per consolidare RomaFlash come l'applicazione di riferimento per i tifosi dell'AS Roma. Tutti i traguardi precedenti (oltre 30 feature) sono già stati completati e deployati in produzione.

---

### 1. Matchday & Stadio Olimpico (Esperienza Partita dal Vivo)

Funzionalità ad alto impatto pensate specificamente per i giorni di gara, sia per chi va allo stadio sia per chi segue la Roma da casa.

*   **1.1 Notifiche Live Gol & Risultato in Tempo Reale:** Push notification istantanea al momento del gol della Roma (*"🐺 GOOOL! Dybala sblocca il match! 1-0"*), fine primo tempo e fischio finale con punteggio e marcatore.
*   **1.2 Guida TV "Dove Vederla":** Box informativo chiaro sotto il countdown della partita che indica subito dove viene trasmesso il match (DAZN, Sky Sport, NOW, Prime Video, Rai/Mediaset).
*   **1.3 Guida allo Stadio Olimpico (Meteo & Info Utili):** Nelle 24h prima delle gare casalinghe: meteo su Roma al fischio d'inizio, orari apertura cancelli e indicazioni linee bus/tram ATAC per l'Olimpico.
*   **1.4 Diretta Testuale & Social Wall (Live Match):** Feed snello in tempo reale durante i 90 minuti per seguire le azioni salienti, cambi e cartellini minuto per minuto.

---

### 2. Dati, Pagelle & Fantacalcio

Potenziamento delle sezioni dati e post-partita sfruttando fonti specializzate e algoritmi dedicati.

*   **2.1 Pagelle & Voti Ufficiali Roma (Fantacalcio.it):** Estrazione automatica post-partita dei voti ufficiali dei calciatori dell'AS Roma da Fantacalcio.it (voto puro di redazione, fantavoto calcolato con bonus/malus come gol, assist, ammonizioni e confronto multi-redazione Fantacalcio/Milano/Statistico).
*   **2.2 Calciomercato Tabellone & Rumor-Meter:** Sezione dedicata al mercato estivo e invernale (Acquisti, Cessioni, Rinnovi) con termometro di affidabilità della fonte (0-100%) calcolato dall'AI.
*   **2.3 Archivio Rosa & Statistiche Giocatori:** Schede dedicate per ciascun calciatore della prima squadra con presenze, gol, assist, minutaggio e trend di rendimento stagionale.

---

### 3. AI & Nuovi Format Multimediali

Evoluzione dei contenuti verso formati moderni e consumabili in mobilità.

*   **3.1 Audio-Notizie (Ascolta l'Articolo):** Sintesi vocale Text-to-Speech nativa (micro-podcast di 30-45 secondi generato dall'AI) con player integrato per ascoltare il riassunto dell'articolo in auto o con gli auricolari.
*   **3.2 Carosello Storie (Fast-News):** Bolle circolari stile Instagram in cima alla Home per scorrere rapidamente le 5 notizie più calde della giornata in formato pillola.
*   **3.3 Swipe Orizzontale fra Articoli (Stile TikTok/Reels):** Navigazione a swipe col pollice da un articolo all'altro senza dover tornare alla home page.
*   **3.4 Generatore "Condividi come Storia Instagram":** Tasto per il lettore che trasforma istantaneamente la notizia in una card verticale (9:16) brandizzata RomaFlash da condividere su Instagram Stories o WhatsApp.
*   **3.5 Fedeltà delle Interviste & Virgolettati Reali:** Aggiornamento del prompt di sintesi di Gemini per preservare e riportare fedelmente tra virgolette (`"..."`) le dichiarazioni testuali esatte rilasciate dai protagonisti (calciatori, mister, dirigenti), evitando che l'AI parafrasi o annacqui le parole originali durante la riscrittura.

---

### 4. Engagement & Community Giallorossa

Funzionalità per aumentare la permanenza sull'app, l'interattività e il senso di appartenenza.

*   **4.1 Reazioni Rapide con Emoji (Muro del Tifoso):** Barra di reazioni istantanee sotto ogni articolo (🐺 *Cuore Giallorosso*, 🔥 *Gasato*, 😡 *Arrabbiato*, 👏 *Applausi*) con contatore animato in tempo reale (senza complessità di moderazione commenti).
*   **4.2 Notizie Salvate (I Miei Preferiti / Pocket):** Tasto segnalibro per salvare le interviste lunghe o gli approfondimenti tattici e rileggerli comodamente in una sezione dedicata.
*   **4.3 Cori della Curva Sud (Audio & Testi):** Raccolta dei cori più famosi della Curva Sud (*Roma Roma Roma*, *Grazie Roma*, *Campo Testaccio*, *Mai Sola Mai*) con traccia audio e testo scorrevole per i tifosi.
*   **4.4 Tempo di Lettura Dinamico:** Micro-badge *"⏱️ 1 min di lettura"* calcolato sul testo per incentivare il click rapido.

---

### 5. Distribuzione, Fonti & Social

*   **5.1 Feed Diretto X/Twitter `@OfficialASRoma`:** Connessione diretta con token di sessione nei secrets di Supabase per importare i tweet ufficiali del club in tempo reale senza dipendere da intermediari RSS a pagamento.
*   **5.2 Filtro "Le Più Lette" (Trending):** Sezione o tab per scoprire le notizie che hanno generato più letture e interesse nelle ultime 24h e 7 giorni.
*   **5.3 Biglietteria Contestuale:** Tasto discreto *"🎟️ Biglietti Ufficiali"* che rimanda al ticketing AS Roma quando l'articolo riguarda un match imminente all'Olimpico.
*   **5.4 Gestione Intelligente delle Fonti (Prompting AI):** Raffinamento dei prompt per citare la testata giornalistica originale solo in caso di interviste esclusive o scoop di mercato.
*   **5.5 Integrazione TikTok (Auto-Post Account RomaFlash):** Pubblicazione automatica hands-free di caroselli fotografici e slide verticali (generate dal nostro motore grafico) direttamente sull'account ufficiale TikTok di RomaFlash tramite TikTok Content Posting API / webhook.
*   **5.6 Integrazione Instagram (Auto-Post Account RomaFlash):** Pubblicazione automatica di post nel feed (formato 4:5) e Storie su Instagram per le notizie principali, le formazioni e il Daily Briefing tramite Instagram Graph API / Buffer.

---

### 6. SEO, Performance & Monetizzazione Etica

*   **6.1 URL SEO-Friendly (Slug Semantici):** Passaggio da `/article?id=UUID` a `/article/UUID-titolo-notizia` per massimizzare il posizionamento organico su Google e Google Discover.
*   **6.2 Supporta RomaFlash (Offrimi un Caffè):** Tasto etico e discreto nel footer o nella sidebar (*"Offri un caffè al progetto"*) tramite Stripe / Ko-Fi per sostenere i costi dei server e dell'AI.
