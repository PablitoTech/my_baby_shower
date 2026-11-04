'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BabyShowerDto, DashboardSummary } from '@mbs/contracts';
import { api, errorKey } from '../api';
import { useDateFormat } from '../language';
import { useToast } from '../ui/toast';
import { useTitle } from '../use-title';
import { useLoad } from './use-load';

export function DashboardPage() {
  const { t } = useTranslation();
  useTitle('nav.dashboard');
  const toast = useToast();
  const fmt = useDateFormat();
  const { data: s, setData, error, reload } = useLoad(() => api<DashboardSummary>('/baby-shower/dashboard'));
  const [busy, setBusy] = useState(false);

  const publicUrl = s?.babyShower.publicSlug ? `${window.location.origin}/baby-shower/${s.babyShower.publicSlug}` : null;

  const countdown = useMemo(() => {
    if (!s) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const event = new Date(s.babyShower.eventDate);
    event.setHours(0, 0, 0, 0);
    const days = Math.round((event.getTime() - start.getTime()) / 86_400_000);
    if (days > 0) return t('dashboard.daysLeft', { days });
    return t(days === 0 ? 'dashboard.today' : 'dashboard.past');
  }, [s, t]);

  const progress = s && s.gifts.unitsRequired > 0 ? Math.round((s.gifts.unitsReserved / s.gifts.unitsRequired) * 100) : 0;

  async function togglePublish(publish: boolean) {
    setBusy(true);
    try {
      const babyShower = await api<BabyShowerDto>(`/baby-shower/${publish ? 'publish' : 'unpublish'}`, { method: 'POST' });
      setData((prev) => (prev ? { ...prev, babyShower } : prev));
      toast.success(publish ? 'dashboard.publishedToast' : 'dashboard.unpublishedToast');
    } catch (err) {
      toast.error(errorKey(err));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('dashboard.linkCopied');
    } catch {
      toast.info(publicUrl);
    }
  }

  if (error) {
    return (
      <div className="alert alert-error" role="alert">
        {t(error)}{' '}
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => void reload()}>
          {t('common.retry')}
        </button>
      </div>
    );
  }
  if (!s) return <p role="status">{t('common.loading')}</p>;

  const b = s.babyShower;
  return (
    <div className="p-dashboard">
      <section className="hero-card fade-up">
        <div>
          <p className="eyebrow">{t('dashboard.eyebrow')}</p>
          <h1 className="baby-name">{b.babyName}</h1>
          <dl className="meta">
            <div>
              <dt>{t('dashboard.eventDate')}</dt>
              <dd>{fmt.full(b.eventDate)} · {fmt.time(b.eventDate)}</dd>
            </div>
            <div>
              <dt>{t('dashboard.parents')}</dt>
              <dd>{b.fatherName} &amp; {b.motherName}</dd>
            </div>
          </dl>
          {b.description && <p className="description">{b.description}</p>}
        </div>
        {countdown && <div className="countdown">{countdown}</div>}
      </section>

      <section className="grid stats" aria-label={t('dashboard.summaryTitle')}>
        <article className="stat stat-lavender"><span className="stat-value">{s.gifts.total}</span><span className="stat-label">{t('dashboard.giftsTotal')}</span></article>
        <article className="stat stat-mint"><span className="stat-value">{s.gifts.available}</span><span className="stat-label">{t('dashboard.available')}</span></article>
        <article className="stat stat-beige"><span className="stat-value">{s.gifts.partiallyReserved}</span><span className="stat-label">{t('dashboard.partial')}</span></article>
        <article className="stat stat-pink"><span className="stat-value">{s.gifts.reserved}</span><span className="stat-label">{t('dashboard.reserved')}</span></article>
      </section>

      <div className="grid two">
        <section className="card">
          <h2>{t('dashboard.summaryTitle')}</h2>
          <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="muted">{t('dashboard.units', { reserved: s.gifts.unitsReserved, required: s.gifts.unitsRequired })}</p>
          <h3>{t('dashboard.reservationsTitle')}</h3>
          <ul className="res-list">
            <li><span className="badge badge-confirmed">{t('dashboard.confirmed')}</span> {s.reservations.confirmed}</li>
            <li><span className="badge badge-delivered">{t('dashboard.delivered')}</span> {s.reservations.delivered}</li>
            <li><span className="badge badge-cancelled">{t('dashboard.cancelled')}</span> {s.reservations.cancelled}</li>
          </ul>
        </section>

        <section className="card link-card">
          <h2>{t('dashboard.publicLinkTitle')}</h2>
          {b.isPublished && publicUrl ? (
            <>
              <p>{t('dashboard.published')}</p>
              <div className="link-box">
                <label className="sr-only" htmlFor="public-url">{t('dashboard.publicLinkTitle')}</label>
                <input id="public-url" className="input" value={publicUrl} readOnly onFocus={(e) => e.currentTarget.select()} />
                <button type="button" className="btn btn-primary" onClick={() => void copyLink()}>📋 {t('dashboard.copyLink')}</button>
              </div>
              <div className="actions">
                <a className="btn btn-secondary btn-sm" href={publicUrl} target="_blank" rel="noopener noreferrer">{t('dashboard.openLink')} ↗</a>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void togglePublish(false)}>{t('dashboard.unpublish')}</button>
              </div>
            </>
          ) : (
            <>
              <p>{t(b.publicSlug ? 'dashboard.unpublishedWithLink' : 'dashboard.notPublished')}</p>
              <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={() => void togglePublish(true)}>
                🚀 {t(b.publicSlug ? 'dashboard.republish' : 'dashboard.publish')}
              </button>
            </>
          )}
        </section>
      </div>

      <section>
        <h2 className="quick-title">{t('dashboard.quickLinks')}</h2>
        <div className="grid quick">
          <Link className="quick-link" href="/gifts"><span className="quick-icon" aria-hidden="true">🎁</span><strong>{t('dashboard.manageGifts')}</strong><span>{t('dashboard.manageGiftsText')}</span></Link>
          <Link className="quick-link" href="/reservations"><span className="quick-icon" aria-hidden="true">📋</span><strong>{t('dashboard.manageReservations')}</strong><span>{t('dashboard.manageReservationsText')}</span></Link>
          <Link className="quick-link" href="/event"><span className="quick-icon" aria-hidden="true">🗓️</span><strong>{t('dashboard.editEvent')}</strong><span>{t('dashboard.editEventText')}</span></Link>
        </div>
      </section>
    </div>
  );
}
