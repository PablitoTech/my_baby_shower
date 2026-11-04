import type { GiftDto } from '@mbs/contracts';
import { availableQuantity } from '@mbs/shared';
import type { Category, Gift } from '../generated/prisma/client.js';

export const imageUrl = (path: string | null) => (path ? `/uploads/${path}` : null);

export function toGiftDto(g: Gift & { category: Category }): GiftDto {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    category: { id: g.category.id, code: g.category.code, sortOrder: g.category.sortOrder },
    quantityRequired: g.quantityRequired,
    quantityReserved: g.quantityReserved,
    quantityAvailable: availableQuantity(g.quantityRequired, g.quantityReserved),
    imageUrl: imageUrl(g.imagePath),
    status: g.status,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}
