import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReservationStatus, type ReservationFilters, type UpdateReservationStatusRequest } from '@mbs/contracts';

export class ReservationFiltersDto implements ReservationFilters {
  @IsOptional()
  @IsUUID()
  giftId?: string;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
}

export class UpdateReservationStatusDto implements UpdateReservationStatusRequest {
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
