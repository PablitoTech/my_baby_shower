import type { ReservationStatus } from './enums';

export interface CreateReservationRequest {
  guestName: string;
  quantity: number;
  message?: string;
}

export interface ReservationConfirmation {
  confirmationCode: string;
  giftName: string;
  quantity: number;
}

export interface ReservationDto {
  id: string;
  confirmationCode: string;
  gift: { id: string; name: string };
  guestName: string;
  quantity: number;
  message: string | null;
  status: ReservationStatus;
  confirmedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationFilters {
  giftId?: string;
  status?: ReservationStatus;
}

export interface UpdateReservationStatusRequest {
  status: ReservationStatus;
}
