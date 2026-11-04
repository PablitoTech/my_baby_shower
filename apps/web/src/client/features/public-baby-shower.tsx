'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { VALIDATION as V } from '@mbs/common';
import type { PublicBabyShower, PublicGift, ReservationConfirmation } from '@mbs/contracts';
import { reservationFormSchema } from '@/shared/schemas';
import { api, errorCode, errorKey } from '../api';
import { useDateFormat } from '../language';
import { Field, a11y } from '../ui/field';
import { GiftCard } from '../ui/gift-card';
import { Modal } from '../ui/modal';
import { useTitle } from '../use-title';
import { useLoad } from './use-load';

type ReservationForm = z.input<ReturnType<typeof reservationFormSchema>>;

/* eslint-disable @next/next/no-img-element */
export function PublicBabyShowerPage({ slug }: { slug: string }) {
  const { t } = useTranslation();
  useTitle('public.giftsTitle');
  const fmt = useDateFormat();
  const { data, setData, loading, error, rawError, reload } = useLoad(
    () => api<PublicBabyShower>(`/public/baby-showers/${encodeURIComponent(slug)}`),
    [slug],
  );
  const notFound = ['BABY_SHOWER_NOT_FOUND', 'NOT_FOUND'].includes(errorCode(rawError) ?? '');

  const [categoryFilter, setCategoryFilter] = useState('');
  /** Solo regalos con unidades disponibles (el backend ya excluye los agotados). */
  const availableGifts = useMemo(() => (data?.gifts ?? []).filter((g) => g.quantityAvailable > 0), [data]);
  const categories = useMemo(() => [...new Set(availableGifts.map((g) => g.categoryCode))], [availableGifts]);
  const visibleGifts = availableGifts.filter((g) => !categoryFilter || g.categoryCode === categoryFilter);

  const [selected, setSelected] = useState<PublicGift | null>(null);
  const [confirmation, setConfirmation] = useState<ReservationConfirmation | null>(null);

  /** Actualiza la disponibilidad sin mostrar el estado de carga. */
  async function refreshQuietly(keepSelection: boolean) {
    try {
      const fresh = await api<PublicBabyShower>(`/public/baby-showers/${encodeURIComponent(slug)}`);
      setData(fresh);
      if (categoryFilter && !fresh.gifts.some((g) => g.categoryCode === categoryFilter)) setCategoryFilter('');
      if (keepSelection && selected) setSelected(fresh.gifts.find((g) => g.publicId === selected.publicId) ?? null);
    } catch {
      /* se mantiene la información anterior */
    }
  }

  function close() {
    setSelected(null);
    setConfirmation(null);
  }

  if (loading && !data) return <p className="container" style={{ padding: '4rem 16px' }} role="status">{t('common.loading')}</p>;

  if (notFound) {
    return (
      <section className="container empty-state" style={{ paddingBlock: '5rem' }}>
        <img src="/images/empty.svg" alt="" width={160} height={128} />
        <h1>{t('public.notFoundTitle')}</h1>
        <p>{t('public.notFoundText')}</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="container empty-state" style={{ paddingBlock: '5rem' }}>
        <p className="alert alert-error" role="alert">{t(error ?? 'errors.INTERNAL_ERROR')}</p>
        <button type="button" className="btn btn-primary" onClick={() => void reload()}>{t('common.retry')}</button>
      </section>
    );
  }

  const d = data;
  return (
    <div className="p-public">
      <section className="cover">
        <div className="container cover-inner fade-up">
          <p className="eyebrow">{t('public.eyebrow')}</p>
          <h1>{d.babyName}</h1>
          <p className="parents">{t('public.parents', { father: d.fatherName, mother: d.motherName })}</p>
          <p className="date">
            <span aria-hidden="true">🗓️</span>
            <span className="sr-only">{t('public.eventDate')}:</span>
            {fmt.full(d.eventDate)} · {fmt.time(d.eventDate)}
          </p>
          {d.description && <p className="description">{d.description}</p>}
        </div>
        <img className="cover-art" src="/images/hero.svg" alt="" aria-hidden="true" />
      </section>

      <section className="container gifts">
        <header className="gifts-header">
          <h2>{t('public.giftsTitle')}</h2>
          <p>{t('public.giftsSubtitle')}</p>
        </header>

        {categories.length > 1 && (
          <div className="chips" role="group" aria-label={t('gifts.filterCategory')}>
            <button type="button" className={`chip ${!categoryFilter ? 'active' : ''}`} aria-pressed={!categoryFilter} onClick={() => setCategoryFilter('')}>
              {t('public.allCategories')}
            </button>
            {categories.map((c) => (
              <button key={c} type="button" className={`chip ${categoryFilter === c ? 'active' : ''}`} aria-pressed={categoryFilter === c} onClick={() => setCategoryFilter(c)}>
                {t(`categories.${c}`)}
              </button>
            ))}
          </div>
        )}

        {visibleGifts.length === 0 && !categoryFilter ? (
          <div className="empty-state">
            <img src="/images/empty.svg" alt="" width={160} height={128} />
            <p>{t(d.hasFullyReservedGifts ? 'public.allReserved' : 'public.noGifts')}</p>
          </div>
        ) : visibleGifts.length === 0 ? (
          <div className="empty-state"><p>{t('gifts.emptyFiltered')}</p></div>
        ) : (
          <div className="gift-grid">
            {visibleGifts.map((gift) => (
              <GiftCard
                key={gift.publicId}
                name={gift.name}
                description={gift.description}
                categoryCode={gift.categoryCode}
                imageUrl={gift.imageUrl}
                status={gift.status}
                available={gift.quantityAvailable}
                required={gift.quantityRequired}
              >
                <button type="button" className="btn btn-primary btn-block" onClick={() => { setConfirmation(null); setSelected(gift); }}>
                  🎁 {t('public.reserve')}
                </button>
              </GiftCard>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={!!selected}
        heading={confirmation ? t('public.successTitle') : selected ? t('public.formTitle', { gift: selected.name }) : ''}
        onClose={close}
      >
        {confirmation ? (
          <div className="success" role="status">
            <div className="success-icon" aria-hidden="true">💝</div>
            <p>{t('public.successText', { quantity: confirmation.quantity, gift: confirmation.giftName })}</p>
            <p>{t('public.successCode')} <strong className="code">{confirmation.confirmationCode}</strong></p>
            <button type="button" className="btn btn-primary" onClick={close}>{t('public.successClose')}</button>
          </div>
        ) : selected ? (
          <ReservationFormView
            key={selected.publicId}
            slug={slug}
            gift={selected}
            onReserved={(result) => {
              setConfirmation(result);
              void refreshQuietly(false);
            }}
            onConflict={() => void refreshQuietly(true)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function ReservationFormView({
  slug,
  gift,
  onReserved,
  onConflict,
}: {
  slug: string;
  gift: PublicGift;
  onReserved: (r: ReservationConfirmation) => void;
  onConflict: () => void;
}) {
  const { t } = useTranslation();
  const schema = useMemo(() => reservationFormSchema(gift.quantityAvailable), [gift.quantityAvailable]);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ReservationForm, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { guestName: '', guestEmail: '', quantity: 1, message: '' },
  });
  const e = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      onReserved(
        await api<ReservationConfirmation>(`/public/baby-showers/${encodeURIComponent(slug)}/gifts/${encodeURIComponent(gift.publicId)}/reservations`, {
          method: 'POST',
          body: values,
        }),
      );
    } catch (err) {
      setError(errorKey(err));
      if (errorCode(err) === 'RESERVATION_EXCEEDS_AVAILABLE') onConflict();
    }
  });

  return (
    <>
      <p className="muted">{t('public.formSubtitle', { count: gift.quantityAvailable })}</p>
      <form className="form-grid" onSubmit={onSubmit} noValidate>
        {error && <div className="alert alert-error" role="alert">{t(error)}</div>}
        <Field id="guestName" label={t('public.guestName')} error={e.guestName}>
          <input {...a11y('guestName', e.guestName)} autoComplete="name" maxLength={V.GUEST_NAME_MAX} {...register('guestName')} />
        </Field>
        <Field id="guestEmail" optional label={t('public.guestEmail')} error={e.guestEmail}>
          <input {...a11y('guestEmail', e.guestEmail)} type="email" autoComplete="email" {...register('guestEmail')} />
        </Field>
        <Field id="quantity" label={t('public.quantity')} error={e.quantity}>
          <input {...a11y('quantity', e.quantity)} type="number" inputMode="numeric" min={1} max={gift.quantityAvailable} {...register('quantity', { valueAsNumber: true })} />
        </Field>
        <Field id="message" optional label={t('public.message')} error={e.message}>
          <textarea {...a11y('message', e.message)} rows={3} maxLength={V.GUEST_MESSAGE_MAX} placeholder={t('public.messagePlaceholder')} {...register('message')} />
        </Field>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={formState.isSubmitting}>
          {t(formState.isSubmitting ? 'common.loading' : 'public.submit')}
        </button>
      </form>
    </>
  );
}
