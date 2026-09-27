import React from 'react';

export default function PitchView({ formation }: { formation: any }) {
  if (!formation || !formation.modulo) return null;

  return (
    <div className="w-full max-w-md mx-auto my-8 bg-green-800 rounded-lg p-4 border-2 border-green-600 shadow-xl relative overflow-hidden">
      {/* Linee del campo da calcio */}
      <div className="absolute inset-2 border-2 border-green-500 rounded-sm opacity-50 pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-b-2 border-l-2 border-r-2 border-green-500 rounded-b-md opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t-2 border-l-2 border-r-2 border-green-500 rounded-t-md opacity-50 pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-full border-t-2 border-green-500 opacity-50 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-green-500 rounded-full opacity-50 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col justify-between h-[500px]">
        {/* Attaccanti */}
        <div className="flex justify-evenly items-center w-full pt-4">
          {formation.attaccanti?.map((player: string, i: number) => (
            <PlayerDot key={`att-${i}`} name={player} role="ATT" />
          ))}
        </div>
        
        {/* Centrocampisti */}
        <div className="flex justify-evenly items-center w-full">
          {formation.centrocampisti?.map((player: string, i: number) => (
            <PlayerDot key={`cen-${i}`} name={player} role="CEN" />
          ))}
        </div>

        {/* Difensori */}
        <div className="flex justify-evenly items-center w-full">
          {formation.difensori?.map((player: string, i: number) => (
            <PlayerDot key={`def-${i}`} name={player} role="DIF" />
          ))}
        </div>

        {/* Portiere */}
        <div className="flex justify-center items-center w-full pb-2">
          {formation.portiere?.map((player: string, i: number) => (
            <PlayerDot key={`gk-${i}`} name={player} role="POR" />
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-2 right-4 text-xs font-bold text-white/50 bg-black/30 px-2 py-1 rounded">
        Modulo: {formation.modulo}
      </div>
    </div>
  );
}

function PlayerDot({ name, role }: { name: string, role: string }) {
  return (
    <div className="flex flex-col items-center gap-1 group">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-600 border-2 border-yellow-500 shadow-md flex items-center justify-center transform transition-transform group-hover:scale-110">
        <span className="text-[9px] md:text-[10px] font-bold text-white uppercase">{role}</span>
      </div>
      <span className="text-white text-[10px] md:text-xs font-bold bg-black/60 px-2 py-0.5 rounded shadow whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}
