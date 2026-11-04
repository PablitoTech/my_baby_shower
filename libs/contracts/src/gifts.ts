import type { GiftStatus } from './enums.js';

export interface CategoryDto {
  id: string;
  code: string;
  sortOrder: number;
}

export interface GiftDto {
  id: string;
  name: string;
  description: string | null;
  category: CategoryDto;
  quantityRequired: number;
  quantityReserved: number;
  quantityAvailable: number;
  imageUrl: string | null;
  status: GiftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGiftRequest {
  name: string;
  description?: string;
  categoryId: string;
  quantityRequired: number;
}

export type UpdateGiftRequest = Partial<CreateGiftRequest>;

/** Regalo visible para invitados. `publicId` es un identificador opaco. */
export interface PublicGift {
  publicId: string;
  name: string;
  description: string | null;
  categoryCode: string;
  quantityRequired: number;
  quantityAvailable: number;
  imageUrl: string | null;
  status: GiftStatus;
}
