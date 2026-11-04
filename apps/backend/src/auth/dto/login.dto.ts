import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { VALIDATION } from '@mbs/common';
import type { LoginRequest } from '@mbs/contracts';
import { ToLowerCase } from '../../common/utils/transformers.js';

export class LoginDto implements LoginRequest {
  @ToLowerCase()
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.EMAIL_MAX)
  identifier: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.PASSWORD_MAX)
  password: string;
}
