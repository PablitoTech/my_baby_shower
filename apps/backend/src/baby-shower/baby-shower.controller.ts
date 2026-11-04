import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import type { BabyShowerDto, DashboardSummary } from '@mbs/contracts';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator.js';
import { BabyShowerService } from './baby-shower.service.js';
import { UpdateBabyShowerDto } from './dto/update-baby-shower.dto.js';

@Controller('baby-shower')
export class BabyShowerController {
  constructor(private readonly service: BabyShowerService) {}

  @Get()
  get(@CurrentUser() user: RequestUser): Promise<BabyShowerDto> {
    return this.service.get(user.id);
  }

  @Patch()
  update(@CurrentUser() user: RequestUser, @Body() dto: UpdateBabyShowerDto): Promise<BabyShowerDto> {
    return this.service.update(user.id, dto);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: RequestUser): Promise<DashboardSummary> {
    return this.service.dashboard(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('publish')
  publish(@CurrentUser() user: RequestUser): Promise<BabyShowerDto> {
    return this.service.publish(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('unpublish')
  unpublish(@CurrentUser() user: RequestUser): Promise<BabyShowerDto> {
    return this.service.unpublish(user.id);
  }
}
