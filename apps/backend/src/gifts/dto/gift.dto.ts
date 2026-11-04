import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { VALIDATION } from '@mbs/common';
import { GiftStatus, type CreateGiftRequest, type UpdateGiftRequest } from '@mbs/contracts';
import { SanitizeOptionalText, SanitizeText } from '../../common/utils/transformers.js';

export class CreateGiftDto implements CreateGiftRequest {
  @SanitizeText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.GIFT_NAME_MAX)
  name: string;

  @SanitizeOptionalText()
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.GIFT_DESCRIPTION_MAX)
  description?: string;

  @IsUUID()
  categoryId: string;

  @Type(() => Number)
  @IsInt()
  @Min(VALIDATION.GIFT_QUANTITY_MIN)
  @Max(VALIDATION.GIFT_QUANTITY_MAX)
  quantityRequired: number;
}

export class UpdateGiftDto implements UpdateGiftRequest {
  @SanitizeText()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.GIFT_NAME_MAX)
  name?: string;

  @SanitizeText()
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.GIFT_DESCRIPTION_MAX)
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(VALIDATION.GIFT_QUANTITY_MIN)
  @Max(VALIDATION.GIFT_QUANTITY_MAX)
  quantityRequired?: number;
}

export class GiftFiltersDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(GiftStatus)
  status?: GiftStatus;
}
