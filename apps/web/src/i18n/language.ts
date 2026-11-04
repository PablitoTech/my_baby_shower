import { DEFAULT_LANGUAGE, isSupportedLanguage, type Language } from '@mbs/common';

/** Cookie con la preferencia de idioma (dato no sensible). La leen el servidor y la API. */
export const LANGUAGE_COOKIE = 'mbs_lang';

export function resolveLanguage(value: string | undefined | null): Language {
  return isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE;
}
