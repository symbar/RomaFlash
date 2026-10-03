"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';
import { WolfLogo } from '@/components/Icons';

export function LegalModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div 
        className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <WolfLogo className="w-12 h-12 mb-3 opacity-80" />
          <h2 className="text-xl font-bold text-foreground">Roma<span className="text-primary">Flash</span></h2>
        </div>

        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
          <p>
            <strong>Disclaimer Legale:</strong> Questo sito non rappresenta una testata giornalistica in quanto viene aggiornato senza alcuna periodicità. Non può pertanto considerarsi un prodotto editoriale ai sensi della legge n° 62 del 7.03.2001.
          </p>
          <p>
            Tutti i marchi riportati appartengono ai legittimi proprietari. RomaFlash è un sistema automatico di notizie e non è in alcun modo affiliato all'AS Roma.
          </p>
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} RomaFlash. Tutti i diritti riservati.
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 md:hidden rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-card/80 transition-colors shadow-sm"
        aria-label="Informazioni Legali"
      >
        <Info className="w-5 h-5" />
      </button>

      {mounted && typeof document !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  );
}
