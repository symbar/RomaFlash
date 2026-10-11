"use client";

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { WolfLogo } from '@/components/Icons';
import PushNotificationManager from '@/components/PushNotificationManager';
import { LegalModal } from '@/components/LegalModal';
import { useLanguage } from '@/components/LanguageContext';
import { Languages, ChevronDown, Check } from 'lucide-react';

export default function GlobalHeader({ title = 'Le Ultime' }: { title?: string }) {
  const { lang, setLang, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLatest = title === 'Le Ultime' || title === 'Latest News';
  const isLineups = title === 'Probabili Formazioni' || title === 'Predicted Lineups';
  const isStandings = title === 'Classifica Serie A' || title === 'Serie A Standings';
  const isCalendar = title === 'Calendario Stagione' || title === 'Season Fixtures';

  return (
    <header className="flex items-center justify-between py-5 mb-5 border-b border-border relative z-30">
      {/* Left: Brand Logo */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
          <WolfLogo className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight text-secondary">
            Roma<span className="text-primary">Flash</span>
          </h1>
        </Link>
      </div>

      {/* Right: Navigation Tabs + Vertical Dividers + Language Switcher + Utilities (VitePress / RSSHub style) */}
      <div className="flex items-center">
        {/* Desktop Navigation Links aligned right */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link
            href="/"
            className={`transition-colors ${
              isLatest ? 'text-primary font-semibold' : 'text-gray-800 hover:text-primary'
            }`}
          >
            {t('nav.latest')}
          </Link>
          <Link
            href="/formazioni"
            className={`transition-colors ${
              isLineups ? 'text-primary font-semibold' : 'text-gray-800 hover:text-primary'
            }`}
          >
            {t('nav.lineups')}
          </Link>
          <Link
            href="/classifica"
            className={`transition-colors ${
              isStandings ? 'text-primary font-semibold' : 'text-gray-800 hover:text-primary'
            }`}
          >
            {t('nav.standings')}
          </Link>
          <Link
            href="/calendario"
            className={`transition-colors ${
              isCalendar ? 'text-primary font-semibold' : 'text-gray-800 hover:text-primary'
            }`}
          >
            {t('nav.calendar')}
          </Link>
        </nav>

        {/* Vertical Divider 1 (between Tabs and Language Selector on Desktop) */}
        <div className="hidden md:block h-5 w-[1px] bg-gray-200 mx-5" />

        {/* Language Selector (文A ⌄) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-100/80 transition-colors cursor-pointer"
            title={lang === 'it' ? 'Cambia lingua / Change language' : 'Change language / Cambia lingua'}
          >
            <Languages className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">
              {lang}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setLang('it');
                  setDropdownOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                  lang === 'it' ? 'text-primary font-bold bg-primary/5' : 'text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>🇮🇹</span> Italiano
                </span>
                {lang === 'it' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLang('en');
                  setDropdownOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                  lang === 'en' ? 'text-primary font-bold bg-primary/5' : 'text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>🇬🇧</span> English
                </span>
                {lang === 'en' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            </div>
          )}
        </div>

        {/* Vertical Divider 2 (between Language Selector and Utilities) */}
        <div className="h-5 w-[1px] bg-gray-200 mx-3 md:mx-4" />

        {/* Right Utilities */}
        <div className="flex items-center gap-2.5">
          <PushNotificationManager />
          <LegalModal />
        </div>
      </div>
    </header>
  );
}
