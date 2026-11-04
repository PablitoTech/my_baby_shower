import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mbs/common';
import type { BabyShowerDto, DashboardSummary } from '@mbs/contracts';
import { slugify } from '@mbs/shared';
import { ApiException } from '../common/http/api.exception.js';
import { randomSlugSuffix } from '../common/utils/crypto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BabyShower } from '../generated/prisma/client.js';
import { toBabyShowerDto } from './baby-shower.mapper.js';
import type { UpdateBabyShowerDto } from './dto/update-baby-shower.dto.js';

@Injectable()
export class BabyShowerService {
  constructor(private readonly prisma: PrismaService) {}

  /** Devuelve el Baby Shower del usuario autenticado (o 404). */
  async findOwn(userId: string): Promise<BabyShower> {
    const babyShower = await this.prisma.babyShower.findUnique({ where: { userId } });
    if (!babyShower || babyShower.status !== 'ACTIVE') {
      throw new ApiException(HttpStatus.NOT_FOUND, ERROR_CODES.BABY_SHOWER_NOT_FOUND);
    }
    return babyShower;
  }

  async get(userId: string): Promise<BabyShowerDto> {
    return toBabyShowerDto(await this.findOwn(userId));
  }

  async update(userId: string, dto: UpdateBabyShowerDto): Promise<BabyShowerDto> {
    const current = await this.findOwn(userId);
    const updated = await this.prisma.babyShower.update({
      where: { id: current.id },
      data: {
        babyName: dto.babyName,
        fatherName: dto.fatherName,
        motherName: dto.motherName,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        description: dto.description === undefined ? undefined : dto.description || null,
      },
    });
    return toBabyShowerDto(updated);
  }

  /**
   * Publica el Baby Shower. El enlace combina un prefijo legible (nombre del bebé)
   * con un sufijo aleatorio criptográfico; nunca expone el ID interno.
   * Se conserva el mismo enlace si se vuelve a publicar.
   */
  async publish(userId: string): Promise<BabyShowerDto> {
    const current = await this.findOwn(userId);
    const publicSlug = current.publicSlug ?? (await this.generateUniqueSlug(current.babyName));
    const updated = await this.prisma.babyShower.update({
      where: { id: current.id },
      data: { publicSlug, isPublished: true, publishedAt: current.publishedAt ?? new Date() },
    });
    return toBabyShowerDto(updated);
  }

  async unpublish(userId: string): Promise<BabyShowerDto> {
    const current = await this.findOwn(userId);
    const updated = await this.prisma.babyShower.update({
      where: { id: current.id },
      data: { isPublished: false },
    });
    return toBabyShowerDto(updated);
  }

  async dashboard(userId: string): Promise<DashboardSummary> {
    const babyShower = await this.findOwn(userId);
    const [giftGroups, giftUnits, reservationGroups] = await Promise.all([
      this.prisma.gift.groupBy({
        by: ['status'],
        where: { babyShowerId: babyShower.id, recordStatus: 'ACTIVE' },
        _count: { _all: true },
      }),
      this.prisma.gift.aggregate({
        where: { babyShowerId: babyShower.id, recordStatus: 'ACTIVE' },
        _sum: { quantityRequired: true, quantityReserved: true },
      }),
      this.prisma.giftReservation.groupBy({
        by: ['status'],
        where: { gift: { babyShowerId: babyShower.id } },
        _count: { _all: true },
      }),
    ]);
    const giftCount = (s: string) => giftGroups.find((g) => g.status === s)?._count._all ?? 0;
    const resCount = (s: string) => reservationGroups.find((g) => g.status === s)?._count._all ?? 0;
    const available = giftCount('AVAILABLE');
    const partiallyReserved = giftCount('PARTIALLY_RESERVED');
    const reserved = giftCount('RESERVED');
    const pending = resCount('PENDING');
    const confirmed = resCount('CONFIRMED');
    const cancelled = resCount('CANCELLED');
    const delivered = resCount('DELIVERED');
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
      reservations: {
        total: pending + confirmed + cancelled + delivered,
        pending,
        confirmed,
        cancelled,
        delivered,
      },
    };
  }

  private async generateUniqueSlug(babyName: string): Promise<string> {
    const prefix = slugify(babyName, 40);
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = `${prefix}-${randomSlugSuffix(10)}`;
      const taken = await this.prisma.babyShower.findUnique({ where: { publicSlug: slug }, select: { id: true } });
      if (!taken) return slug;
    }
    throw new Error('No fue posible generar un enlace público único');
  }
}
