'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useTitle } from '../use-title';

export function NotFoundView() {
  const { t } = useTranslation();
  useTitle('notFound.title');
  return (
    <section className="container empty-state fade-up p-not-found">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/empty.svg" alt="" width={160} height={128} />
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.text')}</p>
      <Link className="btn btn-primary" href="/">{t('notFound.home')}</Link>
    </section>
  );
}
