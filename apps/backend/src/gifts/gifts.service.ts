import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mbs/common';
import type { GiftDto } from '@mbs/contracts';
import { computeGiftStatus } from '@mbs/shared';
import { ApiException } from '../common/http/api.exception.js';
import { randomPublicId } from '../common/utils/crypto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BabyShowerService } from '../baby-shower/baby-shower.service.js';
import { toGiftDto } from './gift.mapper.js';
import { ImageStorageService } from './image-storage.service.js';
import type { CreateGiftDto, GiftFiltersDto, UpdateGiftDto } from './dto/gift.dto.js';

@Injectable()
export class GiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyShowers: BabyShowerService,
    private readonly images: ImageStorageService,
  ) {}

  async list(userId: string, filters: GiftFiltersDto): Promise<GiftDto[]> {
    const { id: babyShowerId } = await this.babyShowers.findOwn(userId);
    const gifts = await this.prisma.gift.findMany({
      where: { babyShowerId, recordStatus: 'ACTIVE', categoryId: filters.categoryId, status: filters.status },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { createdAt: 'asc' }],
    });
    return gifts.map(toGiftDto);
  }

  async get(userId: string, giftId: string): Promise<GiftDto> {
    return toGiftDto(await this.findOwnGift(userId, giftId));
  }

  async create(userId: string, dto: CreateGiftDto): Promise<GiftDto> {
    const { id: babyShowerId } = await this.babyShowers.findOwn(userId);
    await this.assertCategory(dto.categoryId);
    const gift = await this.prisma.gift.create({
      data: {
        publicId: randomPublicId(),
        babyShowerId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description ?? null,
        quantityRequired: dto.quantityRequired,
      },
      include: { category: true },
    });
    return toGiftDto(gift);
  }

  async update(userId: string, giftId: string, dto: UpdateGiftDto): Promise<GiftDto> {
    const existing = await this.findOwnGift(userId, giftId);
    if (dto.categoryId) await this.assertCategory(dto.categoryId);

    const gift = await this.prisma.$transaction(async (tx) => {
      // Bloquea la fila para que una reserva concurrente no invalide la validación de cantidades.
      const [locked] = await tx.$queryRaw<{ quantity_reserved: number }[]>`
        SELECT quantity_reserved FROM gifts WHERE id = ${existing.id}::uuid FOR UPDATE`;
      const reserved = locked?.quantity_reserved ?? existing.quantityReserved;
      const required = dto.quantityRequired ?? existing.quantityRequired;
      if (required < reserved) {
        throw new ApiException(HttpStatus.CONFLICT, ERROR_CODES.GIFT_QUANTITY_BELOW_RESERVED);
      }
      return tx.gift.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          description: dto.description === undefined ? undefined : dto.description || null,
          categoryId: dto.categoryId,
          quantityRequired: required,
          status: computeGiftStatus(required, reserved),
        },
        include: { category: true },
      });
    });
    return toGiftDto(gift);
  }

  /**
   * Borrado lógico: conserva el historial de reservas.
   * No se permite si hay reservas pendientes o confirmadas (deben cancelarse antes).
   */
  async remove(userId: string, giftId: string): Promise<void> {
    const gift = await this.findOwnGift(userId, giftId);
    const active = await this.prisma.giftReservation.count({
      where: { giftId: gift.id, status: { in: ['PENDING', 'CONFIRMED'] } },
    });
    if (active > 0) {
      throw new ApiException(HttpStatus.CONFLICT, ERROR_CODES.GIFT_HAS_ACTIVE_RESERVATIONS);
    }
    await this.prisma.gift.update({
      where: { id: gift.id },
      data: { recordStatus: 'INACTIVE', deletedAt: new Date() },
    });
  }

  async setImage(userId: string, giftId: string, file: Express.Multer.File | undefined): Promise<GiftDto> {
    const gift = await this.findOwnGift(userId, giftId);
    const imagePath = await this.images.saveGiftImage(file);
    const updated = await this.prisma.gift.update({
      where: { id: gift.id },
      data: { imagePath },
      include: { category: true },
    });
    await this.images.remove(gift.imagePath);
    return toGiftDto(updated);
  }

  async removeImage(userId: string, giftId: string): Promise<GiftDto> {
    const gift = await this.findOwnGift(userId, giftId);
    const updated = await this.prisma.gift.update({
      where: { id: gift.id },
      data: { imagePath: null },
      include: { category: true },
    });
    await this.images.remove(gift.imagePath);
    return toGiftDto(updated);
  }

  /** Busca un regalo verificando que pertenezca al Baby Shower del usuario. */
  private async findOwnGift(userId: string, giftId: string) {
    const gift = await this.prisma.gift.findFirst({
      where: { id: giftId, recordStatus: 'ACTIVE', babyShower: { userId } },
      include: { category: true },
    });
    if (!gift) throw new ApiException(HttpStatus.NOT_FOUND, ERROR_CODES.GIFT_NOT_FOUND);
    return gift;
  }

  private async assertCategory(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findFirst({ where: { id: categoryId, status: 'ACTIVE' } });
    if (!category) throw new ApiException(HttpStatus.BAD_REQUEST, ERROR_CODES.CATEGORY_NOT_FOUND);
  }
}
