"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'it' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  getArticleTitle: (article: any) => string;
  getArticleExcerpt: (article: any) => string;
  getArticleContent: (article: any) => string;
  getArticlePoll: (article: any) => { question: string; options: string[] } | null;
  translateCategory: (cat: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  it: {
    'brand.slogan': "L'essenza delle notizie giallorosse",
    'nav.latest': 'Le Ultime',
    'nav.lineups': 'Formazioni',
    'nav.standings': 'Classifica',
    'nav.calendar': 'Calendario',
    'home.featured': 'In Evidenza',
    'home.live': 'In Diretta',
    'home.new_article_single': 'Nuova Notizia',
    'home.new_article_plural': 'Nuove Notizie',
    'home.no_news': 'Nessuna notizia trovata per',
    'home.load_more': 'Carica altre notizie',
    'home.loading_more': 'Caricamento altre notizie...',
    'home.end_of_news': 'Hai raggiunto la fine delle notizie recenti.',
    'article.back': 'Torna alle notizie',
    'article.not_found': 'Articolo non trovato',
    'article.back_home': 'Torna alla home',
    'article.watch_youtube': 'Guarda su YouTube',
    'article.read_more': 'Continua a leggere',
    'poll.title': 'Sondaggio RomaFlash',
    'poll.voters_Prefix': 'Hanno votato',
    'poll.voters_Suffix': 'tifosi',
    'standings.title': 'Classifica Serie A',
    'standings.team': 'Squadra',
    'standings.empty': 'Nessun dato disponibile.',
    'calendar.title': 'Calendario Stagione',
    'calendar.finished': 'Terminata',
    'calendar.empty': 'Nessun calendario disponibile al momento.',
    'lineups.title': 'Probabili Formazioni',
    'lineups.matchday': 'Giornata',
    'lineups.starters': 'Titolari',
    'lineups.bench': 'Panchina',
    'lineups.team_intro': 'Presentazione squadre',
    'lineups.player_details': 'Dettaglio calciatori',
    'lineups.ballottaggi': 'Ballottaggi',
    'lineups.squalificati': 'Squalificati',
    'lineups.diffidati': 'Diffidati',
    'lineups.infortunati': 'Infortunati',
    'lineups.none': 'Nessun calciatore',
    'lineups.none_ballottaggi': 'Nessun ballottaggio segnalato',
    'lineups.updated_at': 'Aggiornato alle',
    'countdown.days': 'G',
    'countdown.hours': 'O',
    'countdown.minutes': 'M',
    'countdown.seconds': 'S',
    'match.tv_live': 'In TV:',
    'article.prev': 'Notizia precedente',
    'article.next': 'Notizia successiva',
    'article.swipe_hint': 'Scorri col pollice per cambiare notizia',
    'mvp.badge': 'VOTO TIFOSI LIVE',
    'mvp.title': 'Chi è stato il Migliore in Campo?',
    'mvp.subtitle_desktop': 'Vota con 1 tap il tuo MVP di',
    'mvp.subtitle_mobile': 'Tap sul volto per votare ⚡',
    'mvp.voted_success': 'Voto registrato con successo!',
    'mvp.total_votes': 'voti community',
    'mvp.closes_in': 'Chiude tra',
    'mvp.closed': 'Sondaggio concluso',
    'mvp.winner_badge': 'TOP MVP',
    'disclaimer.text': 'Questo sito non rappresenta una testata giornalistica in quanto viene aggiornato senza alcuna periodicità. Non può considerarsi un prodotto editoriale ai sensi della legge n° 62 del 7.03.2001. Non affiliato all\'AS Roma.',
  },
  en: {
    'brand.slogan': 'The essence of Giallorossi news',
    'nav.latest': 'Latest News',
    'nav.lineups': 'Lineups',
    'nav.standings': 'Standings',
    'nav.calendar': 'Fixtures',
    'home.featured': 'Featured',
    'home.live': 'Live',
    'home.new_article_single': 'New Article',
    'home.new_article_plural': 'New Articles',
    'home.no_news': 'No news found for',
    'home.load_more': 'Load more news',
    'home.loading_more': 'Loading more news...',
    'home.end_of_news': 'You have reached the end of recent news.',
    'article.back': 'Back to news',
    'article.not_found': 'Article not found',
    'article.back_home': 'Back to home',
    'article.watch_youtube': 'Watch on YouTube',
    'article.read_more': 'Read more in',
    'poll.title': 'RomaFlash Poll',
    'poll.voters_Prefix': 'Voted by',
    'poll.voters_Suffix': 'fans',
    'standings.title': 'Serie A Standings',
    'standings.team': 'Team',
    'standings.empty': 'No standings data available.',
    'calendar.title': 'Season Fixtures',
    'calendar.finished': 'Full Time',
    'calendar.empty': 'No fixtures available at the moment.',
    'lineups.title': 'Predicted Lineups',
    'lineups.matchday': 'Matchday',
    'lineups.starters': 'Starting XI',
    'lineups.bench': 'Bench',
    'lineups.team_intro': 'Team Preview',
    'lineups.player_details': 'Player Status & Doubts',
    'lineups.ballottaggi': 'Selection Doubts',
    'lineups.squalificati': 'Suspended',
    'lineups.diffidati': 'One Away from Ban',
    'lineups.infortunati': 'Injured',
    'lineups.none': 'No players listed',
    'lineups.none_ballottaggi': 'No selection doubts reported',
    'lineups.updated_at': 'Updated at',
    'countdown.days': 'D',
    'countdown.hours': 'H',
    'countdown.minutes': 'M',
    'countdown.seconds': 'S',
    'match.tv_live': 'Live on TV:',
    'article.prev': 'Previous article',
    'article.next': 'Next article',
    'article.swipe_hint': 'Swipe to browse news',
    'article.latest_news_alert': 'You are on the latest news',
    'mvp.badge': 'LIVE FAN VOTE',
    'mvp.title': 'Who was the Man of the Match?',
    'mvp.subtitle_desktop': 'Tap to vote your MVP for',
    'mvp.subtitle_mobile': 'Tap face to vote ⚡',
    'mvp.voted_success': 'Vote recorded successfully!',
    'mvp.total_votes': 'community votes',
    'mvp.closes_in': 'Closes in',
    'mvp.closed': 'Poll ended',
    'mvp.winner_badge': 'TOP MVP',
    'disclaimer.text': 'This site is not an official news organization as it is updated without regular periodicity (Italian Law no. 62 of 07.03.2001). Unofficial fan platform, not affiliated with AS Roma.',
  }
};

const categoryMapEn: Record<string, string> = {
  'Tutte': 'All',
  'Calciomercato': 'Transfers',
  'Partita': 'Match',
  'Probabili Formazioni': 'Lineups',
  'Infortunio': 'Injuries',
  'Dichiarazioni': 'Quotes',
  'Club': 'Club',
  'Social': 'Social',
  "L'Analista": 'The Analyst',
  'Altro': 'More'
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'it',
  setLang: () => {},
  t: (k) => k,
  getArticleTitle: (a) => a?.title || '',
  getArticleExcerpt: (a) => a?.ai_summary?.excerpt || '',
  getArticleContent: (a) => a?.ai_summary?.content || '',
  getArticlePoll: (a) => a?.ai_summary?.poll || null,
  translateCategory: (c) => c,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('it');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang === 'en' || urlLang === 'it') {
      setLangState(urlLang);
      localStorage.setItem('romaflash_lang', urlLang);
      return;
    }

    const saved = localStorage.getItem('romaflash_lang') as Language | null;
    if (saved === 'it' || saved === 'en') {
      setLangState(saved);
    } else if (
      typeof navigator !== 'undefined' &&
      navigator.language &&
      !navigator.language.toLowerCase().startsWith('it')
    ) {
      setLangState('en');
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('romaflash_lang', newLang);
  };

  const t = (key: string): string => {
    return translations[lang][key] || translations['it'][key] || key;
  };

  function sanitizeSourceText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\bVoceGiallorossa\.it\b/gi, 'RomaFlash')
      .replace(/\bVoceGiallorossa\b/gi, 'RomaFlash')
      .replace(/\bVoce Giallorossa\b/gi, 'RomaFlash')
      .replace(/\bPodcast VG\b/gi, 'Approfondimento')
      .replace(/\bVG Podcast\b/gi, 'Approfondimento')
      .replace(/\bredazione di VG\b/gi, 'redazione di RomaFlash')
      .replace(/\bredazione di VoceGiallorossa\b/gi, 'redazione di RomaFlash');
  }

  const getArticleTitle = (article: any): string => {
    if (!article) return '';
    const raw = lang === 'en' && article.ai_summary?.en?.title
      ? article.ai_summary.en.title
      : (article.title || '');
    return sanitizeSourceText(raw).replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*\*/g, '');
  };

  const getArticleExcerpt = (article: any): string => {
    if (!article) return '';
    const raw = lang === 'en' && article.ai_summary?.en?.excerpt
      ? article.ai_summary.en.excerpt
      : (article.ai_summary?.excerpt || '');
    return sanitizeSourceText(raw).replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*\*/g, '');
  };

  const getArticleContent = (article: any): string => {
    if (!article) return '';
    const raw = lang === 'en' && article.ai_summary?.en?.content
      ? article.ai_summary.en.content
      : (article.ai_summary?.content || '');
    return sanitizeSourceText(raw).replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*\*/g, '');
  };

  const getArticlePoll = (article: any) => {
    if (!article?.ai_summary?.poll) return null;
    if (lang === 'en' && article.ai_summary?.en?.poll?.question && Array.isArray(article.ai_summary?.en?.poll?.options)) {
      return article.ai_summary.en.poll;
    }
    return article.ai_summary.poll;
  };

  const translateCategory = (cat: string): string => {
    if (lang === 'it') return cat;
    return categoryMapEn[cat] || cat;
  };

  return (
    <LanguageContext.Provider value={{
      lang,
      setLang,
      t,
      getArticleTitle,
      getArticleExcerpt,
      getArticleContent,
      getArticlePoll,
      translateCategory
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
