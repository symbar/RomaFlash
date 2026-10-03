"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, CalendarDays, Settings, Flame } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0 shrink-0">
      <div className="h-20 flex items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black font-bold italic text-xl shadow-sm group-hover:scale-105 transition-transform">
            RF
          </div>
          <span className="font-black text-2xl tracking-tight text-foreground">Roma<span className="text-primary">Flash</span></span>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-2">
        <Link href="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${pathname === '/' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground'}`}>
          <Home className="w-5 h-5" />
          Le Ultime
        </Link>
        <Link href="/classifica" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${pathname === '/classifica' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground'}`}>
          <Trophy className="w-5 h-5" />
          Classifica
        </Link>
        <Link href="/calendario" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${pathname === '/calendario' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground'}`}>
          <CalendarDays className="w-5 h-5" />
          Calendario
        </Link>
      </nav>
      
      <div className="p-6 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Impostazioni</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">RomaFlash v2.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
