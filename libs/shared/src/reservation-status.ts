import { ReservationStatus } from '@mbs/contracts';

/**
 * Transiciones permitidas entre estados de reserva.
 * CANCELLED y DELIVERED son estados finales.
 */
const TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED, ReservationStatus.DELIVERED],
  [ReservationStatus.CONFIRMED]: [ReservationStatus.CANCELLED, ReservationStatus.DELIVERED],
  [ReservationStatus.CANCELLED]: [],
  [ReservationStatus.DELIVERED]: [],
};

export function canTransitionReservation(from: ReservationStatus, to: ReservationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function allowedReservationTransitions(from: ReservationStatus): readonly ReservationStatus[] {
  return TRANSITIONS[from];
}

/** Estados que cuentan como unidades comprometidas del regalo. */
export const ACTIVE_RESERVATION_STATUSES: readonly ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.DELIVERED,
];

export function isActiveReservation(status: ReservationStatus): boolean {
  return ACTIVE_RESERVATION_STATUSES.includes(status);
}
