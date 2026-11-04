'use client';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { GiftStatus } from '@mbs/contracts';
import { CategoryIcon } from './category-icon';
import { StatusBadge } from './status-badge';

interface GiftCardProps {
  name: string;
  description: string | null;
  categoryCode: string;
  imageUrl: string | null;
  status: GiftStatus;
  available: number;
  required: number;
  children?: ReactNode;
}

/** Tarjeta de regalo reutilizada en la gestión privada y en la página pública. */
export function GiftCard({ name, description, categoryCode, imageUrl, status, available, required, children }: GiftCardProps) {
  const { t } = useTranslation();
  const percent = required > 0 ? Math.round(((required - available) / required) * 100) : 0;
  return (
    <article className={`c-gift-card ${status === 'RESERVED' ? 'done' : ''}`}>
      <div className="media">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={t('gifts.imageAlt', { name })} loading="lazy" />
        ) : (
          <CategoryIcon code={categoryCode} />
        )}
        <span className="category">{t(`categories.${categoryCode}`)}</span>
      </div>
      <div className="body">
        <div className="title-row">
          <h3>{name}</h3>
          <StatusBadge status={status} />
        </div>
        {description && <p className="description">{description}</p>}
        <div className="qty">
          <div className="bar" aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </div>
          <small>{t('gifts.quantityInfo', { available, required })}</small>
        </div>
        {children && <div className="actions">{children}</div>}
      </div>
    </article>
  );
}
