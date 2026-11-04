'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE } from '@mbs/common';
import en from './locales/en.json';
import es from './locales/es.json';

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { es: { translation: es }, en: { translation: en } },
    // Siempre se arranca en español (también en el servidor) para evitar
    // diferencias de hidratación; la preferencia guardada se aplica al montar.
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false }, // React ya escapa el contenido
  });
}

export default i18n;
