"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, CalendarDays } from 'lucide-react';

export default function TabBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 w-full md:hidden bg-black/80 backdrop-blur-md border-t border-white/10 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        
        <Link href="/" className="flex flex-col items-center justify-center w-full h-full gap-1">
          <Home className={`w-6 h-6 transition-colors ${pathname === '/' ? 'text-secondary' : 'text-gray-500'}`} />
          <span className={`text-[10px] font-medium ${pathname === '/' ? 'text-secondary' : 'text-gray-500'}`}>Home</span>
        </Link>
        
        <Link href="/classifica" className="flex flex-col items-center justify-center w-full h-full gap-1">
          <Trophy className={`w-6 h-6 transition-colors ${pathname === '/classifica' ? 'text-secondary' : 'text-gray-500'}`} />
          <span className={`text-[10px] font-medium ${pathname === '/classifica' ? 'text-secondary' : 'text-gray-500'}`}>Classifica</span>
        </Link>
        
        
        <Link href="/formazioni" className={`flex flex-col items-center gap-1 w-16 ${pathname === '/formazioni' ? 'text-primary' : 'text-gray-500 hover:text-gray-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 ${pathname === '/formazioni' ? 'drop-shadow-[0_0_8px_rgba(255,165,0,0.8)]' : ''}`}>
            <rect width="18" height="12" x="3" y="6" rx="2" ry="2"/>
            <path d="M3 12h18"/>
            <path d="M12 6v12"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          <span className="text-[10px] font-medium tracking-wide">Formazioni</span>
        </Link>
        <Link href="/calendario" className="flex flex-col items-center justify-center w-full h-full gap-1">
          <CalendarDays className={`w-6 h-6 transition-colors ${pathname === '/calendario' ? 'text-secondary' : 'text-gray-500'}`} />
          <span className={`text-[10px] font-medium ${pathname === '/calendario' ? 'text-secondary' : 'text-gray-500'}`}>Calendario</span>
        </Link>
        
      </div>
    </div>
  );
}
