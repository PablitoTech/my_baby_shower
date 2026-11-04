import { z } from 'zod';
import { ERROR_CODES } from '@mbs/common';
import { ApiError } from '@/server/http/errors';

/** Valida que el parámetro de ruta sea un UUID (evita consultas con valores arbitrarios). */
export function uuidParam(value: string, code: 'GIFT_NOT_FOUND' | 'RESERVATION_NOT_FOUND' | 'NOT_FOUND' = 'NOT_FOUND'): string {
  if (!z.uuid().safeParse(value).success) throw new ApiError(404, ERROR_CODES[code]);
  return value;
}
