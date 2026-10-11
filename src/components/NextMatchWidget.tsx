"use client";

import { useEffect, useState } from 'react';
import { Trophy, Calendar, Shield } from 'lucide-react';

interface NextMatchProps {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchDate: string; // ISO string
}

function CompetitionIcon({ competition }: { competition: string }) {
  const comp = competition.toLowerCase();
  
  if (comp.includes('serie a')) {
    // Scudetto tricolore
    return (
      <svg viewBox="0 0 100 120" className="w-3 h-3.5 mr-1" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 0L10 15V50C10 85 50 120 50 120C50 120 90 85 90 50V15L50 0Z" fill="white"/>
        <path d="M10 15L36.6 5.2V115.1C23.3 103.4 10 81.3 10 50V15Z" fill="#009246"/>
        <path d="M36.6 5.2L63.3 0V120C63.3 120 63.3 120 63.3 120L36.6 115.1V5.2Z" fill="#F1F2F1"/>
        <path d="M63.3 0L90 15V50C90 81.3 76.6 103.4 63.3 115.1V0Z" fill="#CE2B37"/>
      </svg>
    );
  }
  
  if (comp.includes('coppa italia')) {
    // Coccarda tricolore
    return (
      <svg viewBox="0 0 100 100" className="w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#009246" />
        <circle cx="50" cy="50" r="33.3" fill="#F1F2F1" />
        <circle cx="50" cy="50" r="16.6" fill="#CE2B37" />
      </svg>
    );
  }
  
  // Coppe europee o altro
  return <Trophy className="w-3 h-3 text-yellow-500 mr-1" />;
}

export default function NextMatchWidget({ homeTeam, awayTeam, competition, matchDate }: NextMatchProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(matchDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null); // Partita in corso o finita
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [matchDate]);

  if (!timeLeft) return null; // Nascondi il widget se non c'è una partita imminente

  const shortComp = competition
    .replace(/UEFA Champions League/i, 'Champions League')
    .replace(/UEFA Europa League/i, 'Europa League')
    .replace(/UEFA Conference League/i, 'Conference League');

  return (
    <div className="bg-gradient-to-r from-primary to-secondary p-[1px] shadow-sm overflow-hidden rounded-xl w-full">
      <div className="bg-white rounded-[11px] px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs md:text-sm">
        
        {/* Info Partita */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-gray-500 flex items-center text-[10px] uppercase font-bold tracking-wider whitespace-nowrap mb-0.5">
            <CompetitionIcon competition={competition} />
            <span className="truncate">{shortComp}</span>
          </span>
          <span className="font-extrabold text-gray-900 uppercase tracking-tight text-xs md:text-[13px] whitespace-nowrap truncate">
            {homeTeam} <span className="text-yellow-600 font-bold mx-0.5">vs</span> {awayTeam}
          </span>
        </div>

        {/* Countdown */}
        <div className="flex items-center shrink-0">
          <div className="flex gap-1 text-center font-mono">
            <div className="flex flex-col">
              <span className="text-gray-900 font-bold text-xs md:text-sm bg-gray-100 px-1.5 py-0.5 rounded">{timeLeft.days}</span>
              <span className="text-[8px] md:text-[9px] text-gray-500 uppercase mt-0.5">G</span>
            </div>
            <span className="text-gray-400 font-bold self-start mt-0.5">:</span>
            <div className="flex flex-col">
              <span className="text-gray-900 font-bold text-xs md:text-sm bg-gray-100 px-1.5 py-0.5 rounded">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span className="text-[8px] md:text-[9px] text-gray-500 uppercase mt-0.5">O</span>
            </div>
            <span className="text-gray-400 font-bold self-start mt-0.5">:</span>
            <div className="flex flex-col">
              <span className="text-gray-900 font-bold text-xs md:text-sm bg-gray-100 px-1.5 py-0.5 rounded">{timeLeft.minutes.toString().padStart(2, '0')}</span>
              <span className="text-[8px] md:text-[9px] text-gray-500 uppercase mt-0.5">M</span>
            </div>
            <span className="text-gray-400 font-bold self-start mt-0.5">:</span>
            <div className="flex flex-col">
              <span className="text-amber-600 font-bold text-xs md:text-sm bg-amber-50 px-1.5 py-0.5 rounded">{timeLeft.seconds.toString().padStart(2, '0')}</span>
              <span className="text-[8px] md:text-[9px] text-amber-600 uppercase mt-0.5">S</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
