'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReservationStatus, type GiftDto, type ReservationDto } from '@mbs/contracts';
import { api, errorKey } from '../api';
import { useDateFormat } from '../language';
import { useConfirm } from '../ui/confirm';
import { StatusBadge } from '../ui/status-badge';
import { useToast } from '../ui/toast';
import { useTitle } from '../use-title';
import { useLoad } from './use-load';

const STATUSES = Object.values(ReservationStatus);

/* eslint-disable @next/next/no-img-element */
export function ReservationsPage() {
  const { t } = useTranslation();
  useTitle('nav.reservations');
  const toast = useToast();
  const confirm = useConfirm();
  const fmt = useDateFormat();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Filtros sincronizados con la URL (?giftId=&status=).
  const giftId = params.get('giftId') ?? '';
  const status = (params.get('status') ?? '') as ReservationStatus | '';

  const [gifts, setGifts] = useState<GiftDto[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, setData, loading, error } = useLoad(
    () => api<ReservationDto[]>('/reservations', { query: { giftId, status } }),
    [giftId, status],
  );
  const reservations = data ?? [];

  useEffect(() => {
    api<GiftDto[]>('/gifts').then(setGifts).catch(() => undefined);
  }, []);

  function setFilter(name: 'giftId' | 'status', value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`);
  }

  /**
   * La reserva ya la confirmó el invitado: los padres la marcan como entregada
   * o la cancelan (pidiendo confirmación, porque libera las unidades).
   */
  async function change(r: ReservationDto, to: 'DELIVERED' | 'CANCELLED') {
    if (to === 'CANCELLED') {
      const ok = await confirm('reservations.cancelConfirm', { params: { guest: r.guestName }, confirmKey: 'reservations.cancel', danger: true });
      if (!ok) return;
    }
    setBusyId(r.id);
    try {
      const updated = await api<ReservationDto>(`/reservations/${r.id}/status`, { method: 'PATCH', body: { status: to } });
      setData((list) =>
        (list ?? []).flatMap((x) => (x.id !== r.id ? [x] : status && updated.status !== status ? [] : [updated])),
      );
      toast.success('reservations.updated');
    } catch (err) {
      toast.error(errorKey(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-reservations">
      <header className="page-header">
        <div>
          <h1>{t('reservations.title')}</h1>
          <p>{t('reservations.subtitle')}</p>
        </div>
      </header>

      <div className="filters card">
        <div className="field">
          <label htmlFor="filter-gift">{t('reservations.filterGift')}</label>
          <select id="filter-gift" value={giftId} onChange={(e) => setFilter('giftId', e.target.value)}>
            <option value="">{t('reservations.allGifts')}</option>
            {gifts.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-status">{t('reservations.filterStatus')}</label>
          <select id="filter-status" value={status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">{t('reservations.allStatuses')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`reservationStatus.${s}`)}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error" role="alert">{t(error)}</div>}

      {loading ? (
        <p role="status">{t('common.loading')}</p>
      ) : reservations.length === 0 ? (
        <div className="empty-state card">
          <img src="/images/empty.svg" alt="" width={160} height={128} />
          <p>{t(giftId || status ? 'reservations.emptyFiltered' : 'reservations.empty')}</p>
        </div>
      ) : (
        <>
          <p className="count" role="status">{t('reservations.count', { count: reservations.length })}</p>
          <ul className="list">
            {reservations.map((r) => {
              return (
                <li key={r.id} className={`reservation card ${r.status !== 'CONFIRMED' ? 'inactive' : ''}`}>
                  <div className="main">
                    <div className="head">
                      <h2>{r.guestName}</h2>
                      <StatusBadge status={r.status} type="reservation" />
                    </div>
                    <p className="gift"><span aria-hidden="true">🎁</span> <strong>{r.quantity} ×</strong> {r.gift.name}</p>
                    {r.guestEmail && <p className="muted"><a href={`mailto:${r.guestEmail}`}>{r.guestEmail}</a></p>}
                    {r.message && <blockquote>“{r.message}”</blockquote>}
                    <details>
                      <summary>{t('reservations.history')} · {t('reservations.code')} {r.confirmationCode}</summary>
                      <ul className="timeline">
                        <li>{t('reservations.confirmedAt', { date: fmt.medium(r.confirmedAt) })}</li>
                        {r.deliveredAt && <li>{t('reservations.deliveredAt', { date: fmt.medium(r.deliveredAt) })}</li>}
                        {r.cancelledAt && <li>{t('reservations.cancelledAt', { date: fmt.medium(r.cancelledAt) })}</li>}
                      </ul>
                    </details>
                  </div>
                  {r.status === 'CONFIRMED' && (
                    <div className="actions">
                      <button type="button" className="btn btn-sm btn-primary" disabled={busyId === r.id} onClick={() => void change(r, 'DELIVERED')}>
                        🎁 {t('reservations.deliver')}
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" disabled={busyId === r.id} onClick={() => void change(r, 'CANCELLED')}>
                        {t('reservations.cancel')}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
