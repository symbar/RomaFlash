"use client";
import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { WolfLogo } from '@/components/Icons';

export function LegalModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 md:hidden rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-card/80 transition-colors shadow-sm"
        aria-label="Informazioni Legali"
      >
        <Info className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl relative border border-gray-200 dark:border-gray-800"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-gray-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-6">
              <WolfLogo className="w-16 h-16 mb-4 opacity-90" />
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Roma<span className="text-primary">Flash</span></h2>
              <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest">Aggregatore</p>
            </div>

            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-center">
              <p>
                <strong className="text-gray-900 dark:text-white">Disclaimer:</strong> Questo sito non rappresenta una testata giornalistica in quanto viene aggiornato senza alcuna periodicita'. Non puo' considerarsi un prodotto editoriale.
              </p>
              <p>
                Tutti i marchi appartengono ai legittimi proprietari. RomaFlash e' un aggregatore automatico e non e' affiliato all'AS Roma.
              </p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400 font-medium">
              &copy; {new Date().getFullYear()} RomaFlash
            </div>
          </div>
        </div>
      )}
    </>
  );
}
