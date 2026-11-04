import type { BabyShowerDto, GiftDto, ReservationDto } from '@mbs/contracts';
import { availableQuantity } from '@mbs/shared';
import type { BabyShower, Category, Gift, GiftReservation } from '../../generated/prisma/client';

export const imageUrl = (image: { id: string } | null | undefined) => (image ? `/api/v1/images/${image.id}` : null);

export function toBabyShowerDto(b: BabyShower): BabyShowerDto {
  return {
    id: b.id,
    babyName: b.babyName,
    fatherName: b.fatherName,
    motherName: b.motherName,
    eventDate: b.eventDate.toISOString(),
    description: b.description,
    isPublished: b.isPublished,
    publicSlug: b.publicSlug,
    publishedAt: b.publishedAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

export type GiftWithRelations = Gift & { category: Category; image: { id: string } | null };

export const GIFT_INCLUDE = { category: true, image: { select: { id: true } } } as const;

export function toGiftDto(g: GiftWithRelations): GiftDto {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    category: { id: g.category.id, code: g.category.code, sortOrder: g.category.sortOrder },
    quantityRequired: g.quantityRequired,
    quantityReserved: g.quantityReserved,
    quantityAvailable: availableQuantity(g.quantityRequired, g.quantityReserved),
    imageUrl: imageUrl(g.image),
    status: g.status,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

export function toReservationDto(r: GiftReservation & { gift: Pick<Gift, 'id' | 'name'> }): ReservationDto {
  return {
    id: r.id,
    confirmationCode: r.confirmationCode,
    gift: { id: r.gift.id, name: r.gift.name },
    guestName: r.guestName,
    quantity: r.quantity,
    message: r.message,
    status: r.status,
    confirmedAt: r.confirmedAt.toISOString(),
    cancelledAt: r.cancelledAt?.toISOString() ?? null,
    deliveredAt: r.deliveredAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
