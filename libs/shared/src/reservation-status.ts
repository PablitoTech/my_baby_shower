import { ReservationStatus } from '@mbs/contracts';

/**
 * Flujo de una reserva: el invitado la confirma al reservar (CONFIRMED) y los
 * padres la marcan como entregada (DELIVERED) o la cancelan (CANCELLED).
 * DELIVERED y CANCELLED son estados finales.
 */
const TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  [ReservationStatus.CONFIRMED]: [ReservationStatus.DELIVERED, ReservationStatus.CANCELLED],
  [ReservationStatus.DELIVERED]: [],
  [ReservationStatus.CANCELLED]: [],
};

export function canTransitionReservation(from: ReservationStatus, to: ReservationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function allowedReservationTransitions(from: ReservationStatus): readonly ReservationStatus[] {
  return TRANSITIONS[from];
}

/** Las reservas confirmadas y entregadas ocupan unidades del regalo; las canceladas no. */
export function holdsUnits(status: ReservationStatus): boolean {
  return status !== ReservationStatus.CANCELLED;
}
