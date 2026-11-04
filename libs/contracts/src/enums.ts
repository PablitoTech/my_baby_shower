/** Estados de disponibilidad de un regalo. */
export const GiftStatus = {
  AVAILABLE: 'AVAILABLE',
  PARTIALLY_RESERVED: 'PARTIALLY_RESERVED',
  RESERVED: 'RESERVED',
} as const;
export type GiftStatus = (typeof GiftStatus)[keyof typeof GiftStatus];

/** Estados de una reserva. */
export const ReservationStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  DELIVERED: 'DELIVERED',
} as const;
export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];

export const UserRole = {
  PARENT: 'PARENT',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
