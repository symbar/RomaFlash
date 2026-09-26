'use client';

import { Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setCanShare(true);
    }
  }, []);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (canShare) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url,
        });
      } catch (error) {
        console.error('Errore durante la condivisione:', error);
      }
    } else {
      // Fallback: copia negli appunti
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copiato negli appunti!');
      } catch (err) {
        console.error('Impossibile copiare:', err);
      }
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="p-2 -mr-2 text-gray-500 hover:text-primary transition-colors rounded-full hover:bg-gray-800"
      title="Condividi"
    >
      <Share2 className="w-4 h-4" />
    </button>
  );
}
