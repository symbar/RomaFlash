"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, CalendarDays } from 'lucide-react';

export default function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0 shrink-0">
      <nav className="flex-1 px-4 py-8 space-y-2 mt-4">
        <Link href="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${pathname === '/' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground'}`}>
          <Home className="w-5 h-5" />
          Le Ultime
        </Link>
        <Link href="/classifica" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${pathname === '/classifica' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground'}`}>
          <Trophy className="w-5 h-5" />
          Classifica
        </Link>
        <Link href="/calendario" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${pathname === '/calendario' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground'}`}>
          <CalendarDays className="w-5 h-5" />
          Calendario
        </Link>
      </nav>
    </aside>
  );
}
