import { GiftStatus } from '@mbs/contracts';

/** Calcula el estado de disponibilidad a partir de las cantidades. */
export function computeGiftStatus(quantityRequired: number, quantityReserved: number): GiftStatus {
  if (quantityReserved <= 0) return GiftStatus.AVAILABLE;
  if (quantityReserved >= quantityRequired) return GiftStatus.RESERVED;
  return GiftStatus.PARTIALLY_RESERVED;
}

export function availableQuantity(quantityRequired: number, quantityReserved: number): number {
  return Math.max(0, quantityRequired - quantityReserved);
}
