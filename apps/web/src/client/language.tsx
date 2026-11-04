'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '@mbs/common';
import { LANGUAGE_COOKIE, createI18n } from '@/i18n';

interface LanguageContextValue {
  language: Language;
  languages: readonly Language[];
  /** Locale para Intl (fechas y números). */
  locale: string;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Idioma de la interfaz. El servidor lo lee de la cookie y renderiza ya en ese
 * idioma, así cliente y servidor coinciden al hidratar (sin parpadeos).
 */
export function LanguageProvider({ initialLanguage, children }: { initialLanguage: Language; children: ReactNode }) {
  const [i18n] = useState(() => createI18n(initialLanguage));
  const [language, setLang] = useState<Language>(initialLanguage);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLang(lang);
      void i18n.changeLanguage(lang);
      document.documentElement.lang = lang;
      document.cookie = `${LANGUAGE_COOKIE}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    },
    [i18n],
  );

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
