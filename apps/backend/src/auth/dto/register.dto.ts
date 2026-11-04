import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PASSWORD_PATTERN, USERNAME_PATTERN, VALIDATION } from '@mbs/common';
import type { RegisterRequest } from '@mbs/contracts';
import { SanitizeOptionalText, SanitizeText, ToLowerCase } from '../../common/utils/transformers.js';

export class RegisterDto implements RegisterRequest {
  @SanitizeText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.PERSON_NAME_MAX)
  fatherName: string;

  @SanitizeText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.PERSON_NAME_MAX)
  motherName: string;

  @SanitizeText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.BABY_NAME_MAX)
  babyName: string;

  @IsDateString({ strict: true })
  eventDate: string;

  @SanitizeOptionalText()
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.EVENT_DESCRIPTION_MAX)
  description?: string;

  @ToLowerCase()
  @IsEmail()
  @MaxLength(VALIDATION.EMAIL_MAX)
  email: string;

  @ToLowerCase()
  @IsString()
  @Length(VALIDATION.USERNAME_MIN, VALIDATION.USERNAME_MAX)
  @Matches(USERNAME_PATTERN)
  username: string;

  @IsString()
  @Length(VALIDATION.PASSWORD_MIN, VALIDATION.PASSWORD_MAX)
  @Matches(PASSWORD_PATTERN)
  password: string;

  @IsString()
  confirmPassword: string;
}
