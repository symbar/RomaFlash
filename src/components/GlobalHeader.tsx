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
  const isSquad = title === 'Rosa AS Roma' || title === 'AS Roma Squad';

  return (
    <header className="flex items-center justify-between gap-2 py-4 md:py-5 mb-5 border-b border-border relative z-30">
      {/* Left: Brand Logo + Slogan */}
      <div className="flex items-center min-w-0">
        <Link href="/" className="flex items-center gap-2 md:gap-2.5 hover:opacity-85 transition-opacity min-w-0">
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 md:w-9.5 md:h-9.5 rounded-full bg-[#26050a] border-2 border-[#f0b516] flex items-center justify-center p-1.5 shadow-sm shrink-0">
            <WolfLogo className="w-full h-full" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-secondary leading-none">
              Roma<span className="text-primary">Flash</span>
            </h1>
            <span className="text-[9.5px] sm:text-[10px] md:text-[11px] font-medium text-gray-500 tracking-tight mt-0.5 leading-tight truncate">
              {t('brand.slogan')}
            </span>
          </div>
        </Link>
      </div>

      {/* Right: Navigation Tabs + Vertical Dividers + Language Switcher + Utilities (VitePress / RSSHub style) */}
      <div className="flex items-center shrink-0">
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
            href="/rosa"
            className={`transition-colors ${
              isSquad ? 'text-primary font-semibold' : 'text-gray-800 hover:text-primary'
            }`}
          >
            {t('nav.squad')}
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

        {/* Language Selector + Official X & TikTok Links (same delimited section, visible on Mobile & Desktop) */}
        <div className="flex items-center gap-0.5 md:gap-1">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1 p-1.5 md:px-2 md:py-1.5 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-100/80 transition-colors cursor-pointer"
              title={lang === 'it' ? 'Cambia lingua / Change language' : 'Change language / Cambia lingua'}
            >
              <Languages className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">
                {lang}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
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
                    <svg viewBox="0 0 36 24" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <rect width="12" height="24" x="0" fill="#009246" />
                      <rect width="12" height="24" x="12" fill="#ffffff" />
                      <rect width="12" height="24" x="24" fill="#ce2b37" />
                    </svg>
                    Italiano
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
                    <svg viewBox="0 0 60 30" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <rect width="60" height="30" fill="#012169"/>
                      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2.5"/>
                      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
                      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
                    </svg>
                    English
                  </span>
                  {lang === 'en' && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              </div>
            )}
          </div>

          <a
            href="https://x.com/romaflashoffici"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-1.5 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-100/80 transition-colors"
            title={lang === 'it' ? 'Seguici su X (@romaflashoffici)' : 'Follow us on X (@romaflashoffici)'}
            aria-label="RomaFlash X Profile"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <a
            href="https://www.tiktok.com/@romaflash4"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-1.5 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-100/80 transition-colors"
            title={lang === 'it' ? 'Seguici su TikTok (@romaflash4)' : 'Follow us on TikTok (@romaflash4)'}
            aria-label="RomaFlash TikTok Profile"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" aria-hidden="true">
              <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
            </svg>
          </a>

          <a
            href="https://www.instagram.com/romaflashofficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-1.5 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-100/80 transition-colors"
            title={lang === 'it' ? 'Seguici su Instagram (@romaflashofficial)' : 'Follow us on Instagram (@romaflashofficial)'}
            aria-label="RomaFlash Instagram Profile"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>

        {/* Vertical Divider 2 (between Language/Social section and Utilities) */}
        <div className="h-4 md:h-5 w-[1px] bg-gray-200 mx-1.5 md:mx-4" />

        {/* Right Utilities */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <PushNotificationManager />
          <LegalModal />
        </div>
      </div>
    </header>
  );
}
