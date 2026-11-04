import { Module } from '@nestjs/common';
import { BabyShowerController } from './baby-shower.controller.js';
import { BabyShowerService } from './baby-shower.service.js';

@Module({
  controllers: [BabyShowerController],
  providers: [BabyShowerService],
  exports: [BabyShowerService],
})
export class BabyShowerModule {}
