import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mbs/common';
import type { ReservationDto } from '@mbs/contracts';
import { canTransitionReservation, computeGiftStatus, isActiveReservation } from '@mbs/shared';
import { ApiException } from '../common/http/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Gift, GiftReservation } from '../generated/prisma/client.js';
import type { ReservationFiltersDto, UpdateReservationStatusDto } from './dto/reservation.dto.js';

function toReservationDto(r: GiftReservation & { gift: Pick<Gift, 'id' | 'name'> }): ReservationDto {
  return {
    id: r.id,
    confirmationCode: r.confirmationCode,
    gift: { id: r.gift.id, name: r.gift.name },
    guestName: r.guestName,
    guestEmail: r.guestEmail,
    quantity: r.quantity,
    message: r.message,
    status: r.status,
    confirmedAt: r.confirmedAt?.toISOString() ?? null,
    cancelledAt: r.cancelledAt?.toISOString() ?? null,
    deliveredAt: r.deliveredAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Historial completo de reservas del Baby Shower del usuario, con filtros opcionales. */
  async list(userId: string, filters: ReservationFiltersDto): Promise<ReservationDto[]> {
    const reservations = await this.prisma.giftReservation.findMany({
      where: {
        giftId: filters.giftId,
        status: filters.status,
        gift: { babyShower: { userId } },
      },
      include: { gift: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reservations.map(toReservationDto);
  }

  /**
   * Cambia el estado de una reserva. Al cancelar una reserva activa se liberan
   * sus unidades en el regalo, dentro de la misma transacción.
   */
  async updateStatus(userId: string, reservationId: string, dto: UpdateReservationStatusDto): Promise<ReservationDto> {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.giftReservation.findFirst({
        where: { id: reservationId, gift: { babyShower: { userId } } },
        select: { id: true, giftId: true },
      });
      if (!reservation) {
        throw new ApiException(HttpStatus.NOT_FOUND, ERROR_CODES.RESERVATION_NOT_FOUND);
      }
      // Bloqueo del regalo y lectura del estado actual de la reserva dentro de la transacción.
      const [gift] = await tx.$queryRaw<{ quantity_required: number; quantity_reserved: number }[]>`
        SELECT quantity_required, quantity_reserved FROM gifts WHERE id = ${reservation.giftId}::uuid FOR UPDATE`;
      const current = await tx.giftReservation.findUniqueOrThrow({ where: { id: reservation.id } });

      if (!gift || !canTransitionReservation(current.status, dto.status)) {
        throw new ApiException(HttpStatus.CONFLICT, ERROR_CODES.RESERVATION_INVALID_TRANSITION);
      }

      const now = new Date();
      if (isActiveReservation(current.status) && !isActiveReservation(dto.status)) {
        const reserved = Math.max(0, gift.quantity_reserved - current.quantity);
        await tx.gift.update({
          where: { id: reservation.giftId },
          data: { quantityReserved: reserved, status: computeGiftStatus(gift.quantity_required, reserved) },
        });
      }

      const updated = await tx.giftReservation.update({
        where: { id: reservation.id },
        data: {
          status: dto.status,
          confirmedAt: dto.status === 'CONFIRMED' ? now : undefined,
          cancelledAt: dto.status === 'CANCELLED' ? now : undefined,
          deliveredAt: dto.status === 'DELIVERED' ? now : undefined,
        },
        include: { gift: { select: { id: true, name: true } } },
      });
      return toReservationDto(updated);
    });
  }
}
