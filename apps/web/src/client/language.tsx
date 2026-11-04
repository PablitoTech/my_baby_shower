'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, isSupportedLanguage, type Language } from '@mbs/common';
import i18n from '@/i18n';

const STORAGE_KEY = 'mbs.lang';

interface LanguageContextValue {
  language: Language;
  languages: readonly Language[];
  /** Locale para Intl (fechas y números). */
  locale: string;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Idioma de la interfaz: español por defecto; la preferencia (dato no sensible) se guarda en localStorage. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>(DEFAULT_LANGUAGE);

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    void i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
    if (isSupportedLanguage(saved) && saved !== DEFAULT_LANGUAGE) setLanguage(saved);
  }, [setLanguage]);

  const value = useMemo(
    () => ({ language, languages: SUPPORTED_LANGUAGES, locale: language === 'es' ? 'es' : 'en-US', setLanguage }),
    [language, setLanguage],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
    </I18nextProvider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  return ctx;
}

/** Formatea fechas según el idioma activo. */
export function useDateFormat() {
  const { locale } = useLanguage();
  return useMemo(
    () => ({
      full: (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(new Date(iso)),
      time: (iso: string) => new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date(iso)),
      medium: (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)),
    }),
    [locale],
  );
}
