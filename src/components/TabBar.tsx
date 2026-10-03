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
        
        <Link href="/calendario" className="flex flex-col items-center justify-center w-full h-full gap-1">
          <CalendarDays className={`w-6 h-6 transition-colors ${pathname === '/calendario' ? 'text-secondary' : 'text-gray-500'}`} />
          <span className={`text-[10px] font-medium ${pathname === '/calendario' ? 'text-secondary' : 'text-gray-500'}`}>Calendario</span>
        </Link>
        
      </div>
    </div>
  );
}
