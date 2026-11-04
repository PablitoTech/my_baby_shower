import { createInstance, type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, type Language } from '@mbs/common';
import en from './locales/en.json';
import es from './locales/es.json';

export { LANGUAGE_COOKIE, resolveLanguage } from './language';

/**
 * Crea una instancia de i18next. Se crea una por render en el servidor (las
 * peticiones simultáneas no comparten idioma) y una por pestaña en el cliente.
 * La inicialización es síncrona porque las traducciones van incluidas.
 */
export function createI18n(language: Language = DEFAULT_LANGUAGE): I18n {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources: { es: { translation: es }, en: { translation: en } },
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false }, // React ya escapa el contenido
    initAsync: false,
  });
  return instance;
}
