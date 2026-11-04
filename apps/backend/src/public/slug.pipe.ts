import { HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { ERROR_CODES } from '@mbs/common';
import { ApiException } from '../common/http/api.exception.js';

const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;

/** Valida identificadores públicos (slugs e IDs opacos) antes de consultarlos. */
@Injectable()
export class SlugPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!SAFE_ID.test(value)) {
      throw new ApiException(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return value;
  }
}
