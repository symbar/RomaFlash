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

  return (
    <div className="bg-gradient-to-r from-red-900 to-yellow-700 p-[1px] shadow-lg overflow-hidden">
      <div className="bg-black px-4 py-2 flex items-center justify-between text-xs md:text-sm">
        
        {/* Info Partita */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-gray-400 flex items-center text-[10px] uppercase font-bold tracking-wider">
              <CompetitionIcon competition={competition} />
              {competition}
            </span>
            <span className="font-bold text-white uppercase tracking-wide">
              {homeTeam} <span className="text-yellow-500 font-normal mx-1">vs</span> {awayTeam}
            </span>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex text-gray-400 mr-2">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex gap-1 md:gap-2 text-center font-mono">
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm md:text-base bg-white/10 px-1.5 md:px-2 py-0.5 rounded">{timeLeft.days}</span>
              <span className="text-[8px] md:text-[10px] text-gray-400 uppercase">G</span>
            </div>
            <span className="text-gray-600 font-bold self-start mt-1">:</span>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm md:text-base bg-white/10 px-1.5 md:px-2 py-0.5 rounded">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span className="text-[8px] md:text-[10px] text-gray-400 uppercase">O</span>
            </div>
            <span className="text-gray-600 font-bold self-start mt-1">:</span>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm md:text-base bg-white/10 px-1.5 md:px-2 py-0.5 rounded">{timeLeft.minutes.toString().padStart(2, '0')}</span>
              <span className="text-[8px] md:text-[10px] text-gray-400 uppercase">M</span>
            </div>
            <span className="text-gray-600 font-bold self-start mt-1">:</span>
            <div className="flex flex-col">
              <span className="text-yellow-500 font-bold text-sm md:text-base bg-yellow-500/10 px-1.5 md:px-2 py-0.5 rounded">{timeLeft.seconds.toString().padStart(2, '0')}</span>
              <span className="text-[8px] md:text-[10px] text-yellow-500/70 uppercase">S</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
