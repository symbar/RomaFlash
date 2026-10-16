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
*   ~~**3.5 Fedeltà delle Interviste & Virgolettati Reali:** Aggiornamento del prompt di sintesi di Gemini per preservare e riportare fedelmente tra virgolette (`"..."`) le dichiarazioni testuali esatte rilasciate dai protagonisti (calciatori, mister, dirigenti), evitando che l'AI parafrasi o annacqui le parole originali durante la riscrittura; formattazione visiva con Quote Card Giallorossa in app e supporto semantico `<blockquote>` per SEO/Edge SSR.~~ ✅ **(Completato)**

---

### 4. Engagement & Community Giallorossa

Funzionalità per aumentare la permanenza sull'app, l'interattività e il senso di appartenenza.

*   ~~**4.1 Reazioni Rapide con Emoji (Muro del Tifoso):** Barra di reazioni istantanee sotto ogni articolo con pulsante Like stile Facebook (👍 Mi piace, ❤️ Love, 😆 Ahahah, 😮 Wow, 😢 Sigh, 😡 Grrr) con dock fluttuante su hover/long-press, persistenza utente e contatori aggiornati in tempo reale tramite Supabase Realtime.~~ ✅ **(Completato)**
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
*   ~~**5.7 Riformulazione Post su X (Zero Link Esterni & Recap Nativo):** Rimozione del link esterno a `romaflash.app` per evitare la penalizzazione dell'algoritmo di X; generazione di un recap incisivo e autosufficiente dell'articolo entro i 280 caratteri, accompagnato dall'immagine d'impatto.~~ ✅ **(Completato)**

---

### 6. SEO, Motori di Ricerca & Ottimizzazione per LLM (GEO)

*   ~~**6.1 Pre-rendering Edge SSR per Notizie (Fase 1 - SEO & LLM Visibility):** Iniezione lato Edge tramite Cloudflare Pages Function per `/article`: generazione al millisecondo zero di HTML completo con `<title>` reale, testo della notizia in tag semantici, metatag OpenGraph/Twitter Cards dinamici (con foto reale dell'articolo) e schema `NewsArticle` per Googlebot, ChatGPT Search, Perplexity, Claude, Meta AI, Google Discover e card social (WhatsApp, X, Facebook).~~ ✅ **(Completato)**
*   ~~**6.2 URL SEO-Friendly con Slug Semantici (Fase 2 - Evolutiva):** Passaggio da `/article?id=UUID` ai percorsi parlanti ricchi di keyword `/notizie/[titolo-notizia-UUID]`, con compatibilità retroattiva, generazione dinamica nella sitemap XML e link card interattive su X stile Sky Sport (immagine cliccabile con link a RomaFlash).~~ ✅ **(Completato)**
*   **6.3 Supporta RomaFlash (Offrimi un Caffè):** Tasto etico e discreto nel footer o nella sidebar (*"Offri un caffè al progetto"*) tramite Stripe / Ko-Fi per sostenere i costi dei server e dell'AI.
