"use client";

import { useEffect, useState } from 'react';
import { Trophy, Calendar } from 'lucide-react';

interface NextMatchProps {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchDate: string; // ISO string
}

const getCompetitionLogo = (competition: string) => {
  const comp = competition.toLowerCase();
  if (comp.includes('serie a')) {
    return "/logos/serie_a.png";
  }
  if (comp.includes('champions')) {
    return "/logos/champions.png";
  }
  if (comp.includes('coppa italia')) {
    return "/logos/coppa.png";
  }
  if (comp.includes('europa league')) {
    return "/logos/europa.png";
  }
  if (comp.includes('conference')) {
    return "/logos/conference.png";
  }
  return null;
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
            <span className="text-gray-400 flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider">
              {getCompetitionLogo(competition) ? (
                <div className="w-4 h-4 bg-white/90 rounded-sm p-0.5 flex items-center justify-center">
                  <img src={getCompetitionLogo(competition)!} alt={competition} className="w-full h-full object-contain" />
                </div>
              ) : (
                <Trophy className="w-3 h-3 text-yellow-500" />
              )}
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
