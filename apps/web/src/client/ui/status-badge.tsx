'use client';

import type { GiftStatus, ReservationStatus } from '@mbs/contracts';
import { useTranslation } from 'react-i18next';

export function StatusBadge({ status, type = 'gift' }: { status: GiftStatus | ReservationStatus; type?: 'gift' | 'reservation' }) {
  const { t } = useTranslation();
  return <span className={`badge badge-${status.toLowerCase()}`}>{t(`${type === 'gift' ? 'giftStatus' : 'reservationStatus'}.${status}`)}</span>;
}
