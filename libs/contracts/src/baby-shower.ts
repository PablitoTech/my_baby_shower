import type { PublicGift } from './gifts';

export interface BabyShowerDto {
  id: string;
  babyName: string;
  fatherName: string;
  motherName: string;
  eventDate: string;
  description: string | null;
  isPublished: boolean;
  publicSlug: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBabyShowerRequest {
  babyName?: string;
  fatherName?: string;
  motherName?: string;
  eventDate?: string;
  description?: string | null;
}

export interface DashboardSummary {
  babyShower: BabyShowerDto;
  gifts: {
    total: number;
    available: number;
    partiallyReserved: number;
    reserved: number;
    unitsRequired: number;
    unitsReserved: number;
  };
  reservations: {
    total: number;
    confirmed: number;
    delivered: number;
    cancelled: number;
  };
}

/** Información pública del Baby Shower (sin IDs internos ni datos privados). */
export interface PublicBabyShower {
  slug: string;
  babyName: string;
  fatherName: string;
  motherName: string;
  eventDate: string;
  description: string | null;
  /** Solo regalos con unidades disponibles: los agotados no se muestran a los invitados. */
  gifts: PublicGift[];
  /** Indica si hay regalos ya reservados por completo (ocultos de la lista). */
  hasFullyReservedGifts: boolean;
}
