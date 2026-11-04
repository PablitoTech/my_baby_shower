import type { ErrorCode } from '@mbs/common';

/** Error de negocio con un código estable que el frontend traduce (`errors.<CODIGO>`). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string = code,
    readonly details?: string[],
  ) {
    super(message);
  }
}
