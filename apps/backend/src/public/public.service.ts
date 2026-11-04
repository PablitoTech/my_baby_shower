import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mbs/common';
import type { PublicBabyShower, ReservationConfirmation } from '@mbs/contracts';
import { availableQuantity, computeGiftStatus } from '@mbs/shared';
import { ApiException } from '../common/http/api.exception.js';
import { randomConfirmationCode } from '../common/utils/crypto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { imageUrl } from '../gifts/gift.mapper.js';
import type { CreateReservationDto } from './dto/create-reservation.dto.js';

interface LockedGiftRow {
  id: string;
  name: string;
  quantity_required: number;
  quantity_reserved: number;
}

/** Servicio de acceso público: solo expone datos públicos de Baby Showers publicados. */
@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getBabyShower(slug: string): Promise<PublicBabyShower> {
    const babyShower = await this.prisma.babyShower.findFirst({
      where: { publicSlug: slug, isPublished: true, status: 'ACTIVE' },
      include: {
        gifts: {
          where: { recordStatus: 'ACTIVE' },
          include: { category: true },
          orderBy: [{ category: { sortOrder: 'asc' } }, { createdAt: 'asc' }],
        },
      },
    });
    if (!babyShower) {
      throw new ApiException(HttpStatus.NOT_FOUND, ERROR_CODES.BABY_SHOWER_NOT_FOUND);
    }
    // Los regalos agotados dejan de mostrarse a los invitados.
    const availableGifts = babyShower.gifts.filter((g) => availableQuantity(g.quantityRequired, g.quantityReserved) > 0);
    return {
      slug,
      babyName: babyShower.babyName,
      fatherName: babyShower.fatherName,
      motherName: babyShower.motherName,
      eventDate: babyShower.eventDate.toISOString(),
      description: babyShower.description,
      hasFullyReservedGifts: availableGifts.length < babyShower.gifts.length,
      gifts: availableGifts.map((g) => ({
        publicId: g.publicId,
        name: g.name,
        description: g.description,
        categoryCode: g.category.code,
        quantityRequired: g.quantityRequired,
        quantityAvailable: availableQuantity(g.quantityRequired, g.quantityReserved),
        imageUrl: imageUrl(g.imagePath),
        status: g.status,
      })),
    };
  }

  /**
   * Registra una reserva de forma transaccional.
   * `SELECT ... FOR UPDATE` bloquea la fila del regalo: las reservas concurrentes
   * sobre el mismo regalo se serializan y nunca superan la cantidad disponible.
   */
  async reserve(slug: string, giftPublicId: string, dto: CreateReservationDto): Promise<ReservationConfirmation> {
    return this.prisma.$transaction(async (tx) => {
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

      if (!gift) {
        throw new ApiException(HttpStatus.NOT_FOUND, ERROR_CODES.GIFT_NOT_FOUND);
      }
      if (dto.quantity > availableQuantity(gift.quantity_required, gift.quantity_reserved)) {
        throw new ApiException(HttpStatus.CONFLICT, ERROR_CODES.RESERVATION_EXCEEDS_AVAILABLE);
      }

      const newReserved = gift.quantity_reserved + dto.quantity;
      await tx.gift.update({
        where: { id: gift.id },
        data: { quantityReserved: newReserved, status: computeGiftStatus(gift.quantity_required, newReserved) },
      });
      const reservation = await tx.giftReservation.create({
        data: {
          confirmationCode: randomConfirmationCode(),
          giftId: gift.id,
          guestName: dto.guestName,
          guestEmail: dto.guestEmail ?? null,
          quantity: dto.quantity,
          message: dto.message ?? null,
        },
      });
      return { confirmationCode: reservation.confirmationCode, giftName: gift.name, quantity: reservation.quantity };
    });
  }
}
