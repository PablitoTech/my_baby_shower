import { Controller, Get, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ERROR_CODES } from '@mbs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { ApiException } from '../common/http/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @SkipThrottle()
  @Get()
  async check(): Promise<{ status: 'ok'; database: 'up' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, ERROR_CODES.INTERNAL_ERROR, 'Database unavailable');
    }
  }
}
