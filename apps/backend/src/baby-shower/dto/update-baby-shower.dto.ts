import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { VALIDATION } from '@mbs/common';
import type { UpdateBabyShowerRequest } from '@mbs/contracts';
import { SanitizeText } from '../../common/utils/transformers.js';

export class UpdateBabyShowerDto implements UpdateBabyShowerRequest {
  @SanitizeText()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.BABY_NAME_MAX)
  babyName?: string;

  @SanitizeText()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.PERSON_NAME_MAX)
  fatherName?: string;

  @SanitizeText()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.PERSON_NAME_MAX)
  motherName?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  eventDate?: string;

  @SanitizeText()
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(VALIDATION.EVENT_DESCRIPTION_MAX)
  description?: string | null;
}
