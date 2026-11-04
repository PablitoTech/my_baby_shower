'use client';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../language';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, languages, setLanguage } = useLanguage();
  return (
    <div className="c-lang-switch" role="group" aria-label={t('common.language')}>
      {languages.map((lang) => (
        <button
          key={lang}
          type="button"
          className={language === lang ? 'active' : undefined}
          aria-pressed={language === lang}
          lang={lang}
          title={t(`lang.${lang}`)}
          onClick={() => setLanguage(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
