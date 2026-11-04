import { ERROR_CODES } from '@mbs/common';
import type { CategoryDto, GiftDto } from '@mbs/contracts';
import { computeGiftStatus } from '@mbs/shared';
import type { z } from 'zod';
import type { createGiftSchema, giftFiltersSchema, updateGiftSchema } from '../../shared/schemas';
import { randomPublicId } from '../crypto';
import { db } from '../db/prisma';
import { ApiError } from '../http/errors';
import { findOwnBabyShower } from './baby-shower.service';
import { readImageUpload } from './images.service';
import { GIFT_INCLUDE, toGiftDto } from './mappers';

export async function listCategories(): Promise<CategoryDto[]> {
  return db().category.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, code: true, sortOrder: true },
  });
}

async function assertCategory(categoryId: string): Promise<void> {
  const category = await db().category.findFirst({ where: { id: categoryId, status: 'ACTIVE' } });
  if (!category) throw new ApiError(400, ERROR_CODES.CATEGORY_NOT_FOUND);
}

/** Busca un regalo verificando que pertenezca al Baby Shower del usuario. */
async function findOwnGift(userId: string, giftId: string) {
  const gift = await db().gift.findFirst({
    where: { id: giftId, recordStatus: 'ACTIVE', babyShower: { userId } },
    include: GIFT_INCLUDE,
  });
  if (!gift) throw new ApiError(404, ERROR_CODES.GIFT_NOT_FOUND);
  return gift;
}

export async function listGifts(userId: string, filters: z.output<typeof giftFiltersSchema>): Promise<GiftDto[]> {
  const { id: babyShowerId } = await findOwnBabyShower(userId);
  const gifts = await db().gift.findMany({
    where: { babyShowerId, recordStatus: 'ACTIVE', categoryId: filters.categoryId, status: filters.status },
    include: GIFT_INCLUDE,
    orderBy: [{ category: { sortOrder: 'asc' } }, { createdAt: 'asc' }],
  });
  return gifts.map(toGiftDto);
}

export async function getGift(userId: string, giftId: string): Promise<GiftDto> {
  return toGiftDto(await findOwnGift(userId, giftId));
}

export async function createGift(userId: string, input: z.output<typeof createGiftSchema>): Promise<GiftDto> {
  const { id: babyShowerId } = await findOwnBabyShower(userId);
  await assertCategory(input.categoryId);
  const gift = await db().gift.create({
    data: {
      publicId: randomPublicId(),
      babyShowerId,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description ?? null,
      quantityRequired: input.quantityRequired,
    },
    include: GIFT_INCLUDE,
  });
  return toGiftDto(gift);
}

export async function updateGift(userId: string, giftId: string, input: z.output<typeof updateGiftSchema>): Promise<GiftDto> {
  const existing = await findOwnGift(userId, giftId);
  if (input.categoryId) await assertCategory(input.categoryId);

  const gift = await db().$transaction(async (tx) => {
    // Bloquea la fila para que una reserva concurrente no invalide la validación.
    const [locked] = await tx.$queryRaw<{ quantity_reserved: number }[]>`
      SELECT quantity_reserved FROM gifts WHERE id = ${existing.id}::uuid FOR UPDATE`;
    const reserved = locked?.quantity_reserved ?? existing.quantityReserved;
    const required = input.quantityRequired ?? existing.quantityRequired;
    if (required < reserved) throw new ApiError(409, ERROR_CODES.GIFT_QUANTITY_BELOW_RESERVED);
    return tx.gift.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        description: input.description === undefined ? undefined : input.description || null,
        categoryId: input.categoryId,
        quantityRequired: required,
        status: computeGiftStatus(required, reserved),
      },
      include: GIFT_INCLUDE,
    });
  });
  return toGiftDto(gift);
}

/** Borrado lógico. No se permite con reservas confirmadas aún sin entregar. */
export async function deleteGift(userId: string, giftId: string): Promise<void> {
  const gift = await findOwnGift(userId, giftId);
  const active = await db().giftReservation.count({ where: { giftId: gift.id, status: 'CONFIRMED' } });
  if (active > 0) throw new ApiError(409, ERROR_CODES.GIFT_HAS_ACTIVE_RESERVATIONS);
  await db().gift.update({ where: { id: gift.id }, data: { recordStatus: 'INACTIVE', deletedAt: new Date() } });
}

/** Reemplaza la imagen del regalo (se genera un ID nuevo: la URL cambia y no hay caché obsoleta). */
export async function setGiftImage(userId: string, giftId: string, file: FormDataEntryValue | null): Promise<GiftDto> {
  const gift = await findOwnGift(userId, giftId);
  const { data, mimeType } = await readImageUpload(file);
  await db().$transaction([
    db().giftImage.deleteMany({ where: { giftId: gift.id } }),
    db().giftImage.create({ data: { giftId: gift.id, mimeType, sizeBytes: data.byteLength, data } }),
  ]);
  return toGiftDto(await findOwnGift(userId, giftId));
}

export async function removeGiftImage(userId: string, giftId: string): Promise<GiftDto> {
  const gift = await findOwnGift(userId, giftId);
  await db().giftImage.deleteMany({ where: { giftId: gift.id } });
  return toGiftDto(await findOwnGift(userId, giftId));
}

export async function getImage(imageId: string) {
  return db().giftImage.findFirst({
    where: { id: imageId, gift: { recordStatus: 'ACTIVE' } },
    select: {
      data: true,
      mimeType: true,
      sizeBytes: true,
      gift: { select: { babyShower: { select: { userId: true, isPublished: true, status: true } } } },
    },
  });
}
