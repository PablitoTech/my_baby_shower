import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import type { ReservationDto } from '@mbs/contracts';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator.js';
import { ReservationsService } from './reservations.service.js';
import { ReservationFiltersDto, UpdateReservationStatusDto } from './dto/reservation.dto.js';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() filters: ReservationFiltersDto): Promise<ReservationDto[]> {
    return this.service.list(user.id, filters);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReservationStatusDto,
  ): Promise<ReservationDto> {
    return this.service.updateStatus(user.id, id, dto);
  }
}
