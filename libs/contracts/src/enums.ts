/** Estados de disponibilidad de un regalo. */
export const GiftStatus = {
  AVAILABLE: 'AVAILABLE',
  PARTIALLY_RESERVED: 'PARTIALLY_RESERVED',
  RESERVED: 'RESERVED',
} as const;
export type GiftStatus = (typeof GiftStatus)[keyof typeof GiftStatus];

/**
 * Estados de una reserva:
 * - CONFIRMED: el invitado la confirmó desde la página pública.
 * - DELIVERED: los padres marcaron el regalo como entregado.
 * - CANCELLED: los padres la cancelaron (las unidades vuelven a estar disponibles).
 */
export const ReservationStatus = {
  CONFIRMED: 'CONFIRMED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];

export const UserRole = {
  PARENT: 'PARENT',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
