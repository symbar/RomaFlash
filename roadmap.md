# Roadmap di Sviluppo: RomaFlash PWA 🐺

Ora che abbiamo una PWA autonoma, iper-veloce e ricca di dati in tempo reale, l'obiettivo è continuare a consolidarla come **App Nativa Premium** di riferimento per tutti i tifosi romanisti.

Ecco la roadmap completa e aggiornata con tutte le 10 Fasi originali, i traguardi smarcati e le prossime priorità.

---

### Fase 1: Esperienza App Nativa (Veloce, Affidabile, Mobile-First)

> [!TIP]
> Funzionalità base per garantire reattività e UX da vera applicazione mobile.

*   ~~**1. Funzionamento Offline (Service Workers):**~~ ⏸️ *(Sospeso per garantire sempre il feed live istantaneo)*
*   ~~**2. Pull-to-Refresh Nativo:** Ricaricamento a scorrimento stile Instagram/X.~~ ✅ **(Completato)**
*   ~~**3. Banner Guida iOS / PWA:** Smart App Banner e Modal Istruzioni d'installazione su iPhone e Android.~~ ✅ **(Completato)**
*   ~~**4. Tasto Condivisione Nativa (Web Share API):** Condivisione istantanea su WhatsApp, Telegram e Storie.~~ ✅ **(Completato)**

---

### Fase 2: Evoluzione dell'Intelligenza Artificiale

> [!IMPORTANT]
> Sfruttiamo i modelli AI per arricchire, categorizzare e riassumere le notizie in tempo reale.

*   ~~**1. Tag e Categorie AI:** Categorizzazione automatica (Calciomercato, Infortunio, Dichiarazioni, Partita) con filtri a pillola in alto.~~ ✅ **(Completato)**
*   ~~**2. Analisi del "Sentiment":** Badge contestuale 🔥 Fuoco, ⚡ Fulmine o ❄️ Ghiaccio accanto al titolo.~~ ✅ **(Completato)**
*   ~~**3. Infinite Scroll:** Caricamento continuo e fluido delle notizie storiche.~~ ✅ **(Completato)**
*   ~~**4. Daily Briefing Serale:** Generazione automatica de "Il Punto della Giornata" ogni sera alle 22:00.~~ ✅ **(Completato)**

---

### Fase 3: User Engagement (Leggere di più, leggere meglio)

> [!NOTE]
> Funzionalità pensate per massimizzare la permanenza e l'interattività dei tifosi.

*   ~~**1. Campo da Calcio (Formazione):** Visualizzatore grafico con moduli tattici e maglie dei giocatori.~~ ✅ **(Completato)**
*   ~~**2. Articoli Correlati (Read More):** Sezione a fondo articolo per creare un loop continuo di lettura.~~ ✅ **(Completato)**

---

### Fase 4: Premium UI (Le rifiniture)

*   ~~**1. Header Sticky Sfocato (Glassmorphism):** Trasparenza Apple-style in cima alla pagina.~~ ✅ **(Completato UI)**
*   ~~**2. Pulsante Fluttuante "Nuova Notizia" (Stile X/Twitter):** Pillola dinamica in alto per segnalare nuovi articoli senza reload forzato.~~ ✅ **(Completato)**
*   ~~**3. Animazioni di Transizione (Framer Motion):** Micro-interazioni fluide, tap effects e skeleton loading.~~ ✅ **(Completato)**
*   **4. Tempo di Lettura (Reading Time):** Micro-badge dinamico "⏱️ 1 min di lettura" sotto il titolo.
*   ~~**5. Widget "Prossima Partita" (Countdown):** Barra elegante con timer live alla prossima partita della Roma.~~ ✅ **(Completato UI)**
*   ~~**5b. Dati Reali per Widget Partita:** Connessione a API Football e sincronizzazione automatica avversario/orario.~~ ✅ **(Completato)**
*   ~~**5c. Menu di Navigazione (Stile iOS):** TabBar fissa mobile e Sidebar Desktop unificate (Home, Classifica, Formazioni, Calendario).~~ ✅ **(Completato)**
*   **6. Swipe fra Articoli (Stile TikTok/Storie):** Gesto orizzontale col pollice verso destra per passare all'articolo successivo.
*   ~~**7. Sondaggi Auto-Generati dall'AI:** Sondaggi automatici a 3 opzioni sotto le notizie più calde con salvataggio voti.~~ ✅ **(Completato)**

---

### Fase 5: L'Ecosistema Definitivo (La Visione a Lungo Termine)

*   ~~**1. Notifiche Push (Web Push API):** Notifiche native sullo smartphone per breaking news e comunicati ufficiali.~~ ✅ **(Completato)**
*   ~~**2. Automazioni Background (pg_cron su Supabase):** Schedulazione serverless automatica di feed news (30m), formazioni (1h), classifiche (6h) e briefing (giornaliero).~~ ✅ **(Completato)**

---

### Fase 6: Ottimizzazione SEO & AI (Dominio nei Motori di Ricerca)

> [!IMPORTANT]
> Rendere RomaFlash il punto di riferimento organico per Google e per i motori di risposta AI.

*   ~~**0. Dominio Personalizzato (`romaflash.app`):** Collegamento dominio dedicato `.app` su Cloudflare Pages per uscire dal sandbox `.pages.dev`.~~ ✅ **(Completato)**
*   ~~**1. Meta Tags Dinamici & Open Graph:** Generazione dinamica Edge (`functions/article.ts`) di title, description e immagini social per anteprime WhatsApp/Telegram/X.~~ ✅ **(Completato)**
*   ~~**2. Sitemap XML Dinamica:** Generazione automatica di `/sitemap.xml` (`functions/sitemap.xml.ts`) da Supabase per indicizzazione immediata dei nuovi articoli.~~ ✅ **(Completato)**
*   ~~**3. Dati Strutturati (JSON-LD):** Schema `NewsArticle` e `WebSite` per Google News e rich snippet sportivi.~~ ✅ **(Completato)**
*   **4. URL SEO-Friendly (Slug):** Passaggio da `/article?id=123` a `/article/123-titolo-notizia` con slug parlante.
*   ~~**5. Integrazione llms.txt (AIO):** File `/llms.txt` dinamico (`functions/llms.txt.ts`) con feed live per posizionarsi come fonte primaria per Perplexity, ChatGPT e Claude.~~ ✅ **(Completato)**

---

### Fase 7: Funzionalità Avanzate & Social (Espansione Virale)

> [!NOTE]
> Strumenti di condivisione e community per aumentare la viralità e la riprova sociale.

*   ~~**1. Highlights Video:** Integrazione video highlights con smart thumbnail anti-blocco.~~ ✅ **(Completato)**
*   ~~**2. Embed Post Ufficiali (AS Roma):** Incorporamento automatico di post X/Instagram ufficiali della Roma negli articoli.~~ ✅ **(Completato UI)**
*   **2b. Feed Diretto X/Twitter `@OfficialASRoma` (Sostituzione RSS.app scaduto):** Integrazione diretta autenticata tramite cookie `auth_token` + `ct0` di X salvati nei Secrets di Supabase (logica nativa RSSHub su Supabase/Cloudflare senza abbonamenti a terze parti), per importare i nuovi tweet ufficiali in tempo reale ogni 30 minuti.
*   ~~**3. Auto-Traduzione (Versione Inglese):** Toggle "IT / EN" con traduzione contestuale AI per i tifosi esteri.~~ ✅ **(Completato)**
*   ~~**4. Generatore di Slide Social (Instagram/TikTok):** Generatore di slide verticali 4:5 (1080×1350) con foto reale dell'articolo (o ritratti dedicati), stemma circolare RomaFlash, titolo ad alto impatto e super sunto non troncato (senza badge categoria per conformità all'algoritmo).~~ ✅ **(Completato)**
*   **5. Archivio Storico & Statistiche:** Sezione rosa completa con statistiche stagionali individuali.
*   ~~**6. Look & Feel Permanente (Light Mode):** Ottimizzazione definitiva su Light Mode permanente AS Roma (rosso imperiale `#8e1f2f`, giallo ocra `#f0b516`).~~ ✅ **(Completato)**
*   ~~**7. Tracciamento Letture & Backoffice Privato (`/stats`):** Contatore letture uniche su Supabase, dashboard privata protetta da PIN (`No-Index` / anti-bot AI), icona PWA dedicata (`RF Stats`), filtro più/meno letti, eliminazione rapida articoli e generatore TikTok slide integrato.~~ ✅ **(Completato)**
*   **7b. Evoluzione Backoffice `/stats` & "Le Più Lette":** Aggiunta di Auto-Refresh automatico (ogni 30/60s) e Pull-to-Refresh nativo nella PWA `/stats`, oltre a eventuale filtro pubblico 🔥 *"Le più lette"*.
*   ~~**8. Auto-Pubblicazione su X/Twitter (`@romaflashoffici`):** Pubblicazione automatica 100% hands-free dei nuovi articoli e del Daily Briefing su X con allegato diretto dell'immagine dell'articolo (`assets: image`) tramite Buffer GraphQL API e Twitter Card `summary_large_image` via Cloudflare Pages Function.~~ ✅ **(Completato)**

---

### Fase 8: Espansione Funzionalità (Nuove Idee Selezionate)

*   ~~**0. Layout Responsivo Desktop & Mobile:** Sidebar fissa su PC, griglia magazine responsiva, bottone "Carica altre notizie" + Footer su Desktop e TabBar mobile nativa con codice unificato.~~ ✅ **(Completato)**
*   **1. Pagelle AI Post-Partita:** Generazione istantanea di pagelle oggettive e analisi giocatori al fischio finale.
*   ~~**2. Regolazione Testo (Accessibilità):** Pulsante "Aa" negli articoli per ingrandire la dimensione del testo.~~ ✅ **(Completato)**
*   **3. Carosello Storie (Fast-News):** Bolle circolari stile Instagram in Home per consultare le ultime 5 notizie in micro-formato.
*   **4. Statistiche & Rosa Aggiornata:** Tab dedicata con rosa completa, ruoli e numeri di maglia.
*   **5. Biglietteria Contestuale:** Tasto discreto "🎟️ Biglietti Ufficiali" quando l'articolo riguarda un match allo Stadio Olimpico.
*   **6. Supporta RomaFlash (Offrimi un Caffè):** Tasto etico e discreto nel footer ("Offri un caffè") via Ko-Fi.

---

### Fase 9: Legal, Compliance & Etica AI

*   ~~**1. Scudo Legale "No-Testata" (Footer):** Disclaimer di legge (L. 62/2001) per esenzione registrazione testata giornalistica.~~ 🏆 **(Completato)**
*   **2. Gestione Intelligente delle Fonti (Prompt AI):** Prompting calibrato per citare la testata originaria solo per scoop esclusivi o interviste riservate.

---

### Fase 10: Nuove Idee (Ispirate dai Competitor e oltre)

> [!TIP]
> Funzionalità ispirate dai grandi portali sportivi ma rivisitate in chiave moderna, pulita e potenziata dall'AI.

*   ~~**1. Probabili Formazioni dal Vivo (Fantacalcio.it):**~~ ✅ **(Completato)**
    * Widget campo da calcio 3D isometrico ottimizzato mobile (`h-[280px]`).
    * Modulo tattico ufficiale per Roma e avversario.
    * Titolari con percentuali di titolarità e panchine complete.
    * Ballottaggi ufficiali a coppie con Donut Chart percentuali.
    * Liste infortuni con date rientro stimate, squalifiche e diffide.
    * Presentazione editoriale squadre dinamica basata su dati reali di giornata.
    * Visualizzazione appaiata side-by-side (`grid-cols-2`) anche su PWA mobile.
*   **2. Audio-Notizie (Ascolta l'Articolo):** Sintesi vocale Text-to-Speech (micro-podcast di 30 secondi) per ascoltare le news in mobilità.
*   **3. Calciomercato Tabellone & Rumor-Meter:** Sezione/Widget dedicato al mercato (Acquisti, Cessioni, Trattative) con termometro di affidabilità fonte (0-100%).
*   **4. Diretta Testuale & Social Wall (Live Match):** Feed in tempo reale durante la partita per seguire l'andamento del match.
*   ~~**5. Editoriali e "Il Tattico" (Analisi AI):** Rubrica post-partita "L'Analista | La Lavagna Tattica" basata sui dati statistici reali ESPN (possesso, tiri, passaggi, contrasti, intercettazioni) con grafica dedicata The Athletic, auto-post su X e push notification.~~ ✅ **(Completato)**
*   **6. Pagelle & Voti Ufficiali Roma (Fantacalcio.it):** Estrazione automatica post-partita dei voti ufficiali dei calciatori dell'AS Roma da Fantacalcio.it (voto puro di redazione, fantavoto calcolato, bonus/malus come gol, assist, ammonizioni e confronto multi-redazione Fantacalcio/Milano/Statistico).

---

### Analitiche e Monitoraggio
*   ~~**1. Integrazione Cloudflare Web Analytics:** Monitoraggio privacy-first senza banner cookie.~~ ✅ **(Completato)**
*   ~~**2. Backoffice Privato `/stats` (`RF Stats`):** Cruscotto proprietario per monitorare letture articoli, categorie e voti sondaggi.~~ ✅ **(Completato)**
