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
    const hasDismissed = localStorage.getItem('romaflash_dismiss_install') === 'true';

    // 3. Riconosco il sistema operativo
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (checkStandalone() || hasDismissed) {
      setIsStandalone(true);
      return;
    }

    setIsStandalone(false);

    // Aspettiamo un paio di secondi prima di far apparire il banner per non aggredire l'utente
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

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
    localStorage.setItem('romaflash_dismiss_install', 'true');
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
      {/* Banner Principale */}
      <div className="fixed top-4 left-4 right-4 md:max-w-md md:left-1/2 md:-translate-x-1/2 bg-roma-red text-white p-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-10 fade-in duration-500 border border-white/20">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-4 pr-6">
          <div className="bg-white/20 p-2 rounded-xl shrink-0">
            <Download className="w-6 h-6 text-roma-yellow" />
          </div>
          <div>
            <h4 className="font-bold font-serif text-lg leading-tight mb-1">Porta RomaFlash con te</h4>
            <p className="text-sm text-white/90 leading-tight mb-3">
              Installa l'App gratuita per non perdere nemmeno una notizia. Senza pubblicità.
            </p>
            <button 
              onClick={handleInstallClick}
              className="bg-roma-yellow text-black px-4 py-1.5 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-transform"
            >
              Installa Ora
            </button>
          </div>
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
