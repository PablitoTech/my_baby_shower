import { ERROR_CODES } from '@mbs/common';
import type { ReservationDto } from '@mbs/contracts';
import { canTransitionReservation, computeGiftStatus, holdsUnits } from '@mbs/shared';
import type { z } from 'zod';
import type { reservationFiltersSchema, updateReservationStatusSchema } from '../../shared/schemas';
import { db } from '../db/prisma';
import { ApiError } from '../http/errors';
import { toReservationDto } from './mappers';

/** Historial de reservas del Baby Shower del usuario, con filtros opcionales. */
export async function listReservations(userId: string, filters: z.output<typeof reservationFiltersSchema>): Promise<ReservationDto[]> {
  const reservations = await db().giftReservation.findMany({
    where: { giftId: filters.giftId, status: filters.status, gift: { babyShower: { userId } } },
    include: { gift: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return reservations.map(toReservationDto);
}

/**
 * Cambia el estado de una reserva confirmada: entregada o cancelada.
 * Al cancelar se liberan sus unidades en el regalo. Todo ocurre en una
 * transacción con la fila del regalo bloqueada, para que una reserva
 * concurrente no desajuste las cantidades.
 */
export async function updateReservationStatus(
  userId: string,
  reservationId: string,
  input: z.output<typeof updateReservationStatusSchema>,
): Promise<ReservationDto> {
  return db().$transaction(async (tx) => {
    const reservation = await tx.giftReservation.findFirst({
      where: { id: reservationId, gift: { babyShower: { userId } } },
      select: { id: true, giftId: true },
    });
    if (!reservation) throw new ApiError(404, ERROR_CODES.RESERVATION_NOT_FOUND);

    const [gift] = await tx.$queryRaw<{ quantity_required: number; quantity_reserved: number }[]>`
      SELECT quantity_required, quantity_reserved FROM gifts WHERE id = ${reservation.giftId}::uuid FOR UPDATE`;
    // Se vuelve a leer con el regalo bloqueado: el estado no puede cambiar a medio camino.
    const current = await tx.giftReservation.findUniqueOrThrow({ where: { id: reservation.id } });
    if (!gift || !canTransitionReservation(current.status, input.status)) {
      throw new ApiError(409, ERROR_CODES.RESERVATION_INVALID_TRANSITION);
    }

    if (holdsUnits(current.status) && !holdsUnits(input.status)) {
      const reserved = Math.max(0, gift.quantity_reserved - current.quantity);
      await tx.gift.update({
        where: { id: reservation.giftId },
        data: { quantityReserved: reserved, status: computeGiftStatus(gift.quantity_required, reserved) },
      });
    }

    const now = new Date();
    const updated = await tx.giftReservation.update({
      where: { id: reservation.id },
      data: {
        status: input.status,
        deliveredAt: input.status === 'DELIVERED' ? now : undefined,
        cancelledAt: input.status === 'CANCELLED' ? now : undefined,
      },
      include: { gift: { select: { id: true, name: true } } },
    });
    return toReservationDto(updated);
  });
}
