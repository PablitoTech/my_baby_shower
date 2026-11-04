import { Module } from '@nestjs/common';
import { BabyShowerModule } from '../baby-shower/baby-shower.module.js';
import { GiftsController } from './gifts.controller.js';
import { GiftsService } from './gifts.service.js';
import { ImageStorageService } from './image-storage.service.js';

@Module({
  imports: [BabyShowerModule],
  controllers: [GiftsController],
  providers: [GiftsService, ImageStorageService],
})
export class GiftsModule {}
