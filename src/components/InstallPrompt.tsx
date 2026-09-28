"use client";

import { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';

export function InstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(true); // Default a true per non farlo "lampeggiare" prima del controllo
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showiOSInstructions, setShowiOSInstructions] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Controllo se l'app è già installata (Standalone mode)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      // @ts-ignore (per navigator.standalone che è specifico di Apple)
      const isStandaloneApple = window.navigator.standalone === true;
      return isStandaloneMedia || isStandaloneApple;
    };

    // 2. Controllo se l'utente l'ha chiuso in passato
    const hasDismissed = localStorage.getItem('romaflash_dismiss_top_banner') === 'true';

    // 3. Riconosco il sistema operativo
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (checkStandalone() || hasDismissed) {
      setIsStandalone(true); return; }

    setIsStandalone(false);

    // Aspettiamo un paio di secondi prima di far apparire il banner per non aggredire l'utente
    const timer = setTimeout(() => { setIsVisible(true); }, 100);

    // Catturo l'evento nativo di Android/Chrome per l'installazione automatica
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('romaflash_dismiss_top_banner', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      // Su iOS apriamo le istruzioni manuali
      setShowiOSInstructions(true);
    } else if (deferredPrompt) {
      // Su Android usiamo il prompt nativo
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback per PC o browser che non supportano l'evento nativo ma non sono iOS
      alert("Per installare l'app, apri le impostazioni del tuo browser e clicca su 'Installa App' o 'Aggiungi a Home'.");
    }
  };

  if (isStandalone || !isVisible) return null;

  return (
    <>
      {/* Banner Principale Statico in Cima */}
        <div className="w-full bg-card border-b-2 border-primary shadow-sm animate-in slide-in-from-top-4 fade-in duration-500 relative">
          <div className="max-w-2xl mx-auto p-3 flex items-center gap-3">
            <button 
              onClick={handleDismiss}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/10 rounded-full transition-colors shrink-0"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm leading-tight text-foreground truncate">
                Installa <span className="text-primary">Roma</span><span className="text-secondary">Flash</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-tight truncate">
                Pi� veloce, niente pubblicit�.
              </p>
            </div>
            <button 
              onClick={handleInstallClick}
              className="bg-secondary text-black px-4 py-1.5 rounded-full font-bold text-sm shadow-sm hover:scale-105 transition-transform shrink-0 whitespace-nowrap"
            >
              Installa
            </button>
          </div>
        </div>

      {/* Modal Istruzioni iOS */}
      {showiOSInstructions && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-end md:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 relative border border-border shadow-2xl animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95">
            <button 
              onClick={() => setShowiOSInstructions(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold font-serif mb-4 text-white">Installa su iPhone/iPad</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Apple non permette l'installazione automatica. Segui questi due semplici passaggi:
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/20 p-3 rounded-xl shrink-0 text-blue-400">
                  <Share className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white mb-1">1. Tocca Condividi</p>
                  <p className="text-sm text-gray-400">Premi l'icona di condivisione che trovi nella barra in basso del browser Safari.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-green-500/20 p-3 rounded-xl shrink-0 text-green-400">
                  <PlusSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white mb-1">2. Aggiungi a Home</p>
                  <p className="text-sm text-gray-400">Scorri l'elenco e seleziona "Aggiungi alla schermata Home". Fatto!</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowiOSInstructions(false)}
              className="w-full mt-8 bg-white text-black font-bold py-3 rounded-xl"
            >
              Ho capito, grazie!
            </button>
          </div>
        </div>
      )}
    </>
  );
}







