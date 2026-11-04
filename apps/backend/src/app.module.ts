import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ENV_FILE_PATH, validateEnv } from './config/env.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { AuthGuard } from './common/guards/auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { HealthController } from './health/health.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { BabyShowerModule } from './baby-shower/baby-shower.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { GiftsModule } from './gifts/gifts.module.js';
import { PublicModule } from './public/public.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ENV_FILE_PATH, validate: validateEnv, cache: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    PrismaModule,
    AuthModule,
    BabyShowerModule,
    CategoriesModule,
    GiftsModule,
    PublicModule,
    ReservationsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
