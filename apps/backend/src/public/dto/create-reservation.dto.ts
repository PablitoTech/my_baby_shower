import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { VALIDATION } from '@mbs/common';
import type { CreateReservationRequest } from '@mbs/contracts';
import { SanitizeOptionalText, SanitizeText, ToLowerCase } from '../../common/utils/transformers.js';

export class CreateReservationDto implements CreateReservationRequest {
  @SanitizeText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.GUEST_NAME_MAX)
  guestName: string;

  @ToLowerCase()
  @SanitizeOptionalText()
  @IsOptional()
  @IsEmail()
  @MaxLength(VALIDATION.EMAIL_MAX)
  guestEmail?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(VALIDATION.GIFT_QUANTITY_MAX)
  quantity: number;

  @SanitizeOptionalText()
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.GUEST_MESSAGE_MAX)
  message?: string;
}
