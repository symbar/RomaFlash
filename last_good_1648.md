# Roadmap di Sviluppo: RomaFlash PWA ðŸº

Ora che abbiamo una PWA funzionante, autonoma e veloce, l'obiettivo Ã¨ trasformarla da un "sito web veloce" a una vera e propria **App Nativa Premium** agli occhi degli utenti.

Ecco una roadmap divisa in 3 fasi per elevare RomaFlash al livello successivo.

---

### Fase 1: La vera esperienza App (Veloce, Affidabile, Offline)

> [!TIP]
> Queste implementazioni aumenteranno drasticamente il tempo che gli utenti trascorrono sull'app.

*   ~~**1. Funzionamento Offline (Service Workers):** Attualmente se l'utente apre l'app senza connessione (es. in metropolitana), vedrÃ  un errore. Implementando un _Service Worker_ con Workbox, possiamo far sÃ¬ che l'app carichi all'istante l'ultimo feed scaricato in precedenza, permettendogli di leggere le notizie offline.~~ â¸ï¸ **(Sospeso)**
*   ~~**2. Pull-to-Refresh Nativo:** Implementare un gesto di scorrimento verso il basso (come su Instagram o X) per ricaricare forzatamente il feed senza dover usare il tasto "aggiorna" del browser.~~ âœ… **(Completato)**
*   **3. Banner Guida iOS:** Come abbiamo visto, Apple non aiuta. Possiamo programmare un piccolo e non invasivo banner animato che compare in basso solo agli utenti iPhone, indicando fisicamente dove cliccare per aggiungere l'app alla Home.
*   ~~**4. Tasto Condivisione Nativa (Web Share API):** Un bottone sugli articoli che apre direttamente il menu di condivisione di sistema del telefono (per mandare l'articolo su WhatsApp, Telegram o Storie).~~ âœ… **(Completato)**

---

### Fase 2: Evoluzione dell'Intelligenza Artificiale

> [!IMPORTANT]
> Sfruttiamo Gemini per categorizzare i contenuti, non solo per riassumerli.

*   ~~**1. Tag e Categorie AI:** Possiamo dire a Gemini di aggiungere al file JSON anche una categoria (es. `Calciomercato`, `Infortunio`, `Dichiarazioni`, `Partita`). In questo modo possiamo aggiungere dei "pill" (pulsanti) in cima all'app per filtrare istantaneamente le notizie.~~ âœ… **(Completato)**
*   ~~**2. Analisi del "Sentiment":** Gemini puÃ² dirci se la notizia Ã¨ "Positiva", "Negativa" o "Neutra". Potremmo mostrare una micro-icona (es. fuoco ðŸ”¥, fulmine âš¡, o ghiaccio â„ï¸) accanto al titolo.~~ âœ… **(Completato)**
*   ~~**3. Infinite Scroll:** Ora carichiamo solo 30 notizie. Possiamo implementare lo scorrimento infinito, caricando blocchi di vecchie notizie mano a mano che l'utente arriva in fondo alla pagina.~~ âœ… **(Completato)**

---

### Fase 3: User Engagement (Leggere di piÃ¹, leggere meglio)

> [!NOTE]
> Queste funzionalitÃ  prendono spunto dalle app di news piÃ¹ famose (es. OneFootball).

*   ~~**1. Campo da Calcio (Formazione):** Se l'articolo AI parla di "Probabili Formazioni", aggiungere un componente visivo (un campetto verde in CSS) con le magliette dei giocatori posizionate nel modulo 4-3-3. Ãˆ la funzionalitÃ  piÃ¹ cliccata in assoluto dai tifosi.~~ âœ… **(Completato)**
*   ~~**2. Articoli Correlati (Read More):** In fondo all'articolo, mostrare 3 "Notizie Simili" (magari filtrate per la stessa Categoria AI, es. Calciomercato) per creare un loop infinito di lettura.~~ âœ… **(Completato)**

---

### Fase 4: Premium UI (Le rifiniture)

*   ~~**1. Header Sticky Sfocato (Glassmorphism):** Un header superiore che scompare parzialmente scorrendo in basso, ma che lascia intravedere il testo sottostante con un effetto sfocato Apple-style.~~ âœ… **(Completato UI)**
*   ~~**2. Pulsante Fluttuante "Nuova Notizia" (Stile Twitter):** Quando l'utente sta scrollando vecchie notizie e il feed RSS ne pubblica una nuova in background, appare una "pillola" al centro in alto ("â†‘ 1 Nuova Notizia"). Cliccandola si ricarica in cima.~~ âœ… **(Completato)**
*   **3. Animazioni di Transizione (Framer Motion):** Aggiungere micro-interazioni, come l'effetto fade quando l'articolo viene caricato o l'espansione fluida dell'immagine copertina.
*   **4. Tempo di Lettura (Reading Time):** Visto che i riassunti di Gemini hanno lunghezze variabili, aggiungere un micro-badge "â±ï¸ 1 min di lettura" dinamico sotto il titolo. Abbassa la barriera cognitiva e incentiva il click.
*   ~~**5. Widget "Prossima Partita":** Invece del vecchio menÃ¹ in basso, creare una sottilissima barra minimal in alto alla Home con il Countdown alla prossima partita della Roma (o il risultato Live). DÃ  immediato respiro sportivo all'app.~~ âœ… **(Completato UI)**
*   ~~**5b. Dati Reali per Widget Partita:** Collegare il Widget a una sorgente dati reale (API Sportiva, Scraping, o feed iCal) tramite Edge Function, in modo che il countdown e gli avversari si aggiornino automaticamente senza intervento manuale.~~ âœ… **(Completato)**
*   ~~**5c. Menu di Navigazione (Stile iOS):** Reintrodurre la navigazione (Bottom Tab Bar o Sidebar) stile app nativa Apple, con le sezioni dedicate: "Home", "Classifica" e "Calendario".~~ âœ… **(Completato)**
*   **6. Swipe fra Articoli (Stile TikTok/Storie):** Quando sei dentro un articolo e arrivi in fondo, invece di dover per forza tornare alla Home o cliccare i Correlati, puoi fare uno "Swipe" orizzontale col pollice verso destra per passare magicamente all'articolo successivo.
*   ~~**7. Sondaggi Auto-Generati dall'AI:** Sotto le notizie controverse (es. esonero, calciomercato), Gemini genera in automatico un sondaggio con 3 opzioni per far votare gli utenti. Crea una community e aumenta a dismisura il tempo speso sull'app.~~ âœ… **(Completato)**

### Fase 5: L'Ecosistema Definitivo (La Visione a Lungo Termine)
*   **1. Notifiche Push (Web Push API):** L'arma finale. Mandare una notifica allo smartphone dell'utente quando c'Ã¨ una "Breaking News" o un "Ufficiale: Nuovo Acquisto", scavalcando i social network e portando l'utente direttamente nell'app.
