import { ERROR_CODES } from '@mbs/common';
import type { BabyShowerDto, DashboardSummary } from '@mbs/contracts';
import { slugify } from '@mbs/shared';
import type { z } from 'zod';
import type { BabyShower } from '../../generated/prisma/client';
import type { updateBabyShowerSchema } from '../../shared/schemas';
import { randomSlugSuffix } from '../crypto';
import { db } from '../db/prisma';
import { ApiError } from '../http/errors';
import { toBabyShowerDto } from './mappers';

/** Baby Shower del usuario autenticado (o 404). */
export async function findOwnBabyShower(userId: string): Promise<BabyShower> {
  const babyShower = await db().babyShower.findUnique({ where: { userId } });
  if (!babyShower || babyShower.status !== 'ACTIVE') throw new ApiError(404, ERROR_CODES.BABY_SHOWER_NOT_FOUND);
  return babyShower;
}

export async function getBabyShower(userId: string): Promise<BabyShowerDto> {
  return toBabyShowerDto(await findOwnBabyShower(userId));
}

export async function updateBabyShower(userId: string, input: z.output<typeof updateBabyShowerSchema>): Promise<BabyShowerDto> {
  const current = await findOwnBabyShower(userId);
  const updated = await db().babyShower.update({
    where: { id: current.id },
    data: {
      babyName: input.babyName,
      fatherName: input.fatherName,
      motherName: input.motherName,
      eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
      description: input.description,
    },
  });
  return toBabyShowerDto(updated);
}

async function generateUniqueSlug(babyName: string): Promise<string> {
  const prefix = slugify(babyName, 40);
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = `${prefix}-${randomSlugSuffix(10)}`;
    const taken = await db().babyShower.findUnique({ where: { publicSlug: slug }, select: { id: true } });
    if (!taken) return slug;
  }
  throw new Error('No fue posible generar un enlace público único');
}

/**
 * Publica el Baby Shower con un enlace legible + sufijo criptográfico.
 * Nunca expone el ID interno y conserva el mismo enlace si se vuelve a publicar.
 */
export async function publishBabyShower(userId: string): Promise<BabyShowerDto> {
  const current = await findOwnBabyShower(userId);
  const publicSlug = current.publicSlug ?? (await generateUniqueSlug(current.babyName));
  const updated = await db().babyShower.update({
    where: { id: current.id },
    data: { publicSlug, isPublished: true, publishedAt: current.publishedAt ?? new Date() },
  });
  return toBabyShowerDto(updated);
}

export async function unpublishBabyShower(userId: string): Promise<BabyShowerDto> {
  const current = await findOwnBabyShower(userId);
  return toBabyShowerDto(await db().babyShower.update({ where: { id: current.id }, data: { isPublished: false } }));
}

export async function getDashboard(userId: string): Promise<DashboardSummary> {
  const babyShower = await findOwnBabyShower(userId);
  const [giftGroups, giftUnits, reservationGroups] = await Promise.all([
    db().gift.groupBy({ by: ['status'], where: { babyShowerId: babyShower.id, recordStatus: 'ACTIVE' }, _count: { _all: true } }),
    db().gift.aggregate({
      where: { babyShowerId: babyShower.id, recordStatus: 'ACTIVE' },
      _sum: { quantityRequired: true, quantityReserved: true },
    }),
    db().giftReservation.groupBy({ by: ['status'], where: { gift: { babyShowerId: babyShower.id } }, _count: { _all: true } }),
  ]);
  const giftCount = (s: string) => giftGroups.find((g) => g.status === s)?._count._all ?? 0;
  const resCount = (s: string) => reservationGroups.find((g) => g.status === s)?._count._all ?? 0;
  const [available, partiallyReserved, reserved] = [giftCount('AVAILABLE'), giftCount('PARTIALLY_RESERVED'), giftCount('RESERVED')];
  const [pending, confirmed, cancelled, delivered] = [resCount('PENDING'), resCount('CONFIRMED'), resCount('CANCELLED'), resCount('DELIVERED')];
  return {
    babyShower: toBabyShowerDto(babyShower),
    gifts: {
      total: available + partiallyReserved + reserved,
      available,
      partiallyReserved,
      reserved,
      unitsRequired: giftUnits._sum.quantityRequired ?? 0,
      unitsReserved: giftUnits._sum.quantityReserved ?? 0,
    },
    reservations: { total: pending + confirmed + cancelled + delivered, pending, confirmed, cancelled, delivered },
  };
}
