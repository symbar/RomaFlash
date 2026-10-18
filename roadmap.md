# Roadmap di Sviluppo: RomaFlash PWA 🐺

> [!NOTE]
> Questa roadmap include le funzionalità aperte e le nuove idee strategiche approvate per consolidare RomaFlash come l'applicazione di riferimento per i tifosi dell'AS Roma.

---

### 1. Matchday & Stadio Olimpico (Esperienza Partita dal Vivo)

Funzionalità ad alto impatto pensate specificamente per i giorni di gara, sia per chi va allo stadio sia per chi segue la Roma da casa.

*   **1.1 Notifiche Live Gol & Risultato in Tempo Reale:** Push notification istantanea al momento del gol della Roma (*"🐺 GOOOL! Dybala sblocca il match! 1-0"*), fine primo tempo e fischio finale con punteggio e marcatore.
*   **1.2 Guida allo Stadio Olimpico (Meteo & Info Utili):** Nelle 24h prima delle gare casalinghe: meteo su Roma al fischio d'inizio, orari apertura cancelli e indicazioni linee bus/tram ATAC per l'Olimpico.
*   **1.3 Diretta Testuale & Social Wall (Live Match):** Feed snello in tempo reale durante i 90 minuti per seguire le azioni salienti, cambi e cartellini minuto per minuto.
*   **1.4 Sincronizzazione Calendario 1-Click (Apple & Google):** Tasto unico che installa il calendario ufficiale della stagione della Roma sul calendario personale dello smartphone, aggiornandosi automaticamente in caso di anticipi e posticipi.
*   **1.5 Biglietti Settore Ospiti:** Quando la Roma gioca fuori casa, info sintetiche su costo, circuito di vendita (TicketOne/Vivaticket) e modalità di acquisto per il settore ospiti.

---

### 2. Dati, Statistiche & Tattica

Potenziamento delle sezioni dati e post-partita sfruttando fonti specializzate e algoritmi dedicati.

*   **2.1 Pagelle & Voti Ufficiali Roma (Fantacalcio.it):** Estrazione automatica post-partita dei voti ufficiali dei calciatori dell'AS Roma da Fantacalcio.it (voto puro di redazione, fantavoto calcolato con bonus/malus come gol, assist, ammonizioni e confronto multi-redazione Fantacalcio/Milano/Statistico).
*   **2.2 Calciomercato Tabellone & Rumor-Meter:** Sezione dedicata al mercato estivo e invernale (Acquisti, Cessioni, Rinnovi) con termometro di affidabilità della fonte (0-100%) calcolato dall'AI.
*   **2.3 Archivio Rosa & Statistiche Giocatori:** Schede dedicate per ciascun calciatore della prima squadra con presenze, gol, assist, minutaggio e trend di rendimento stagionale.
*   [x] ✅ **2.4 Precedenti Head-to-Head (COMPLETATO):** Integrato come tab rapido *"⚔️ Storico"* all'interno del widget `NextMatch` (zero ingombro extra su mobile). Mostra lo storico delle ultime 5 sfide contro l'avversaria di turno (Serie A, Champions League, Europa League, Coppa Italia), con scoreboard V-P-S (Verde/Grigio/Rosso), rapporto gol fatti/subiti, micro-tabellino marcatori e gestione automatica degli incroci inediti.
*   [x] ✅ **2.5 "Il Tassametro Arbitri" (Lo Storico con la Roma) (COMPLETATO):** Integrato come tab rapido *"🟨 Arbitro"* nel widget `NextMatch`. Rileva in automatico la designazione arbitrale della partita in corso (comunicata 36-48h prima da AIA o UEFA) e calcola il "tassametro" completo: presenze, V-P-S, % vittorie, rigori a favore e contro, cartellini rossi (Roma vs avversari), media ammonizioni, ultimo precedente diretto e gestione debutti europei.

---

### 3. AI & Nuovi Format Multimediali

Evoluzione dei contenuti verso formati moderni e consumabili in mobilità.

*   **3.1 Carosello Storie (Fast-News):** Bolle circolari stile Instagram in cima alla Home per scorrere rapidamente le notizie più calde in formato pillola.

---

### 4. Engagement, Community & Gamification

Funzionalità per aumentare la permanenza sull'app, l'interattività e il senso di appartenenza giallorossa.

*   **4.1 Tempo di Lettura Dinamico:** Micro-badge *"⏱️ 1 min di lettura"* calcolato sul testo per incentivare il click rapido.
*   **4.2 "Indovina il Risultato & Marcatore":** Pronostico rapido pre-partita gratuito con classifica punti stagionale tra tutti i lettori di RomaFlash.
*   **4.3 "Trivia del Romanismo" (Quiz Quotidiano):** 3 domande a risposta multipla al giorno sulla storia della Roma (campioni del passato, derby indimenticabili, record).

---

### 5. Distribuzione, Canali & Social

*   **5.1 Feed Diretto X/Twitter `@OfficialASRoma`:** Connessione diretta con token di sessione nei secrets di Supabase per importare i tweet ufficiali del club in tempo reale senza dipendere da intermediari RSS a pagamento.
*   **5.2 Filtro "Le Più Lette" (Trending):** Sezione o tab per scoprire le notizie che hanno generato più letture e interesse nelle ultime 24h e 7 giorni.
*   **5.3 Biglietteria Contestuale:** Tasto discreto *"🎟️ Biglietti Ufficiali"* che rimanda al ticketing AS Roma quando l'articolo riguarda un match imminente all'Olimpico.
*   **5.4 Integrazione TikTok (Auto-Post Account RomaFlash):** Pubblicazione automatica hands-free di caroselli fotografici e slide verticali (generate dal nostro motore grafico) direttamente sull'account ufficiale TikTok di RomaFlash tramite TikTok Content Posting API / webhook.
*   **5.5 Integrazione Instagram (Auto-Post Account RomaFlash):** Pubblicazione automatica di post nel feed (formato 4:5) e Storie su Instagram per le notizie principali, le formazioni e il Daily Briefing tramite Instagram Graph API / Buffer.
*   **5.6 Canale WhatsApp / Telegram Ufficiale "Zero Rumore":** Bot automatico che inoltra esclusivamente 3 notifiche al giorno (il buongiorno alle 8:00, la breaking news se ufficiale, il punto serale alle 20:00).
*   [x] ✅ **5.7 Revisione Auto-Pubblicazione su X (Post Più Corti & Sintesi Ultra-Saliente) (COMPLETATO):** Riveduti i testi generati per X in formato puramente editoriale, corto, secco e d'impatto (massimo 100-120 caratteri per il copy, 120-140 caratteri complessivi con hashtag). Eliminata la concatenazione forzata dell'excerpt, vietati preamboli narrativi da Gemini ed eliminati testi superflui nel footer in favore di una firma snella `#ASRoma #TagDinamico`.

---

### 6. Storia, Amarcord & Cultura Romanista

*   **6.1 Museo Virtuale delle Maglie Storiche:** Galleria con schede e dettagli delle casacche più iconiche dal 1927 a oggi (il "ghiacciolo" Pouchain, la maglia Barilla 82/83, la Kappa dello Scudetto 2001).
*   **6.2 Hall of Fame & Schede Leggende:** Spazio rapido dedicato ai miti giallorossi (Totti, De Rossi, Giannini, Falcao, Bruno Conti, Agostino Di Bartolomei, Losi) con statistiche di carriera, presenze e aneddoti.
