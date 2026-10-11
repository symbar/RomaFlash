import Link from 'next/link';
import { WolfLogo } from '@/components/Icons';
import PushNotificationManager from '@/components/PushNotificationManager';
import { LegalModal } from '@/components/LegalModal';

export default function GlobalHeader({ title = 'Le Ultime' }: { title?: string }) {
  return (
    <header className="flex items-center justify-between py-6 mb-4 border-b border-border relative z-30">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <WolfLogo className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight text-secondary">
            Roma<span className="text-primary">Flash</span>
          </h1>
        </Link>
        
        
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 ml-8 text-sm font-semibold text-gray-500 dark:text-gray-400">
          <Link href="/" className={`flex items-center gap-2 hover:text-primary transition-colors ${title === 'Le Ultime' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            Le Ultime
          </Link>
          
          <Link href="/formazioni" className={`flex items-center gap-2 hover:text-primary transition-colors ${title === 'Probabili Formazioni' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            Formazioni
          </Link>
          <Link href="/calendario" className={`flex items-center gap-2 hover:text-primary transition-colors ${title === 'Calendario Stagione' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            Calendario
          </Link>
        </nav>
      </div>
      
      {/* Utilities only on the right side of the header */}
      <div className="flex items-center gap-3">
        <PushNotificationManager />
        <LegalModal />
      </div>
    </header>
  );
}
