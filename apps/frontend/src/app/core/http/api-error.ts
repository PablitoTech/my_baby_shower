import { HttpErrorResponse } from '@angular/common/http';
import { ERROR_CODES, type ApiErrorBody } from '@mbs/common';

/** Convierte cualquier error HTTP en una clave de traducción `errors.<CODIGO>`. */
export function errorKey(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'errors.NETWORK';
    const body = error.error as Partial<ApiErrorBody> | null;
    if (body?.code && body.code in ERROR_CODES) return `errors.${body.code}`;
    if (error.status === 429) return 'errors.TOO_MANY_REQUESTS';
    if (error.status === 404) return 'errors.NOT_FOUND';
  }
  return 'errors.INTERNAL_ERROR';
}

export function errorCode(error: unknown): string | null {
  if (error instanceof HttpErrorResponse) {
    return (error.error as Partial<ApiErrorBody> | null)?.code ?? null;
  }
  return null;
}
