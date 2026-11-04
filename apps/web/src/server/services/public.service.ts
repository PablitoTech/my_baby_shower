import { ERROR_CODES } from '@mbs/common';
import type { PublicBabyShower, ReservationConfirmation } from '@mbs/contracts';
import { availableQuantity, computeGiftStatus } from '@mbs/shared';
import type { z } from 'zod';
import type { createReservationSchema } from '../../shared/schemas';
import { randomConfirmationCode } from '../crypto';
import { db } from '../db/prisma';
import { ApiError } from '../http/errors';
import { imageUrl } from './mappers';

interface LockedGiftRow {
  id: string;
  name: string;
  quantity_required: number;
  quantity_reserved: number;
}

/** Datos públicos de un Baby Shower publicado. Los regalos agotados no se muestran. */
export async function getPublicBabyShower(slug: string): Promise<PublicBabyShower> {
  const babyShower = await db().babyShower.findFirst({
    where: { publicSlug: slug, isPublished: true, status: 'ACTIVE' },
    include: {
      gifts: {
        where: { recordStatus: 'ACTIVE' },
        include: { category: true, image: { select: { id: true } } },
        orderBy: [{ category: { sortOrder: 'asc' } }, { createdAt: 'asc' }],
      },
    },
  });
  if (!babyShower) throw new ApiError(404, ERROR_CODES.BABY_SHOWER_NOT_FOUND);

  const available = babyShower.gifts.filter((g) => availableQuantity(g.quantityRequired, g.quantityReserved) > 0);
  return {
    slug,
    babyName: babyShower.babyName,
    fatherName: babyShower.fatherName,
    motherName: babyShower.motherName,
    eventDate: babyShower.eventDate.toISOString(),
    description: babyShower.description,
    hasFullyReservedGifts: available.length < babyShower.gifts.length,
    gifts: available.map((g) => ({
      publicId: g.publicId,
      name: g.name,
      description: g.description,
      categoryCode: g.category.code,
      quantityRequired: g.quantityRequired,
      quantityAvailable: availableQuantity(g.quantityRequired, g.quantityReserved),
      imageUrl: imageUrl(g.image),
      status: g.status,
    })),
  };
}

/**
 * Registra una reserva de forma transaccional. `SELECT ... FOR UPDATE` bloquea
 * la fila del regalo: las reservas concurrentes se serializan y nunca superan
 * la cantidad disponible.
 */
export async function reserveGift(
  slug: string,
  giftPublicId: string,
  input: z.output<typeof createReservationSchema>,
): Promise<ReservationConfirmation> {
  return db().$transaction(async (tx) => {
    const [gift] = await tx.$queryRaw<LockedGiftRow[]>`
      SELECT g.id, g.name, g.quantity_required, g.quantity_reserved
      FROM gifts g
      JOIN baby_showers b ON b.id = g.baby_shower_id
      WHERE g.public_id = ${giftPublicId}
        AND b.public_slug = ${slug}
        AND b.is_published = true
        AND b.status = 'ACTIVE'
        AND g.record_status = 'ACTIVE'
      FOR UPDATE OF g`;
    if (!gift) throw new ApiError(404, ERROR_CODES.GIFT_NOT_FOUND);
    if (input.quantity > availableQuantity(gift.quantity_required, gift.quantity_reserved)) {
      throw new ApiError(409, ERROR_CODES.RESERVATION_EXCEEDS_AVAILABLE);
    }
    const newReserved = gift.quantity_reserved + input.quantity;
    await tx.gift.update({
      where: { id: gift.id },
      data: { quantityReserved: newReserved, status: computeGiftStatus(gift.quantity_required, newReserved) },
    });
    const reservation = await tx.giftReservation.create({
      data: {
        confirmationCode: randomConfirmationCode(),
        giftId: gift.id,
        guestName: input.guestName,
        guestEmail: input.guestEmail ?? null,
        quantity: input.quantity,
        message: input.message ?? null,
        // El invitado confirma la reserva al enviarla.
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });
    return { confirmationCode: reservation.confirmationCode, giftName: gift.name, quantity: reservation.quantity };
  });
}
