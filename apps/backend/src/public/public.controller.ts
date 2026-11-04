import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { PublicBabyShower, ReservationConfirmation } from '@mbs/contracts';
import { Public } from '../common/decorators/public.decorator.js';
import { SlugPipe } from './slug.pipe.js';
import { PublicService } from './public.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';

@Public()
@Controller('public/baby-showers')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Get(':slug')
  get(@Param('slug', SlugPipe) slug: string): Promise<PublicBabyShower> {
    return this.service.getBabyShower(slug);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':slug/gifts/:giftId/reservations')
  reserve(
    @Param('slug', SlugPipe) slug: string,
    @Param('giftId', SlugPipe) giftId: string,
    @Body() dto: CreateReservationDto,
  ): Promise<ReservationConfirmation> {
    return this.service.reserve(slug, giftId, dto);
  }
}
