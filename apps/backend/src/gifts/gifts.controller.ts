import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IMAGE_UPLOAD } from '@mbs/common';
import type { GiftDto } from '@mbs/contracts';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator.js';
import { GiftsService } from './gifts.service.js';
import { CreateGiftDto, GiftFiltersDto, UpdateGiftDto } from './dto/gift.dto.js';

@Controller('gifts')
export class GiftsController {
  constructor(private readonly gifts: GiftsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() filters: GiftFiltersDto): Promise<GiftDto[]> {
    return this.gifts.list(user.id, filters);
  }

  @Get(':id')
  get(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string): Promise<GiftDto> {
    return this.gifts.get(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateGiftDto): Promise<GiftDto> {
    return this.gifts.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGiftDto,
  ): Promise<GiftDto> {
    return this.gifts.update(user.id, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.gifts.remove(user.id, id);
  }

  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: IMAGE_UPLOAD.MAX_BYTES, files: 1 },
    }),
  )
  uploadImage(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<GiftDto> {
    return this.gifts.setImage(user.id, id, file);
  }

  @Delete(':id/image')
  removeImage(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string): Promise<GiftDto> {
    return this.gifts.removeImage(user.id, id);
  }
}
