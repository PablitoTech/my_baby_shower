import { IsEmail, IsNotEmpty, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PASSWORD_PATTERN, VALIDATION } from '@mbs/common';
import type { ForgotPasswordRequest, ResetPasswordRequest } from '@mbs/contracts';
import { ToLowerCase } from '../../common/utils/transformers.js';

export class ForgotPasswordDto implements ForgotPasswordRequest {
  @ToLowerCase()
  @IsEmail()
  @MaxLength(VALIDATION.EMAIL_MAX)
  email: string;
}

export class ResetPasswordDto implements ResetPasswordRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  token: string;

  @IsString()
  @Length(VALIDATION.PASSWORD_MIN, VALIDATION.PASSWORD_MAX)
  @Matches(PASSWORD_PATTERN)
  password: string;

  @IsString()
  confirmPassword: string;
}
