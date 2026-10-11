'use client';

import { useLanguage } from '@/components/LanguageContext';

export default function GlobalFooter() {
  const { t } = useLanguage();

  return (
    <footer className="hidden lg:block w-full max-w-7xl mx-auto px-8 mt-auto">
      <div className="border-t border-border/80 py-8 text-center">
        <p className="text-xs text-gray-500 max-w-3xl mx-auto leading-relaxed">
          {t('disclaimer.text')}
        </p>
        <p className="text-xs text-gray-400 font-medium mt-3">
          © 2026 RomaFlash.
        </p>
      </div>
    </footer>
  );
}
