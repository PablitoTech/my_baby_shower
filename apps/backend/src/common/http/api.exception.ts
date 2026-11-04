import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@mbs/common';

/** Excepción de negocio con un código estable que el frontend puede traducir. */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ErrorCode,
    message: string = code,
  ) {
    super({ statusCode: status, code, message }, status);
  }
}
