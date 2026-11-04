'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const APP_NAME = 'My Baby Shower';

/** Título de la pestaña traducido (se actualiza al cambiar de idioma). */
export function useTitle(key: string | null): void {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.title = key ? `${t(key)} · ${APP_NAME}` : APP_NAME;
  }, [key, t, i18n.language]);
}
