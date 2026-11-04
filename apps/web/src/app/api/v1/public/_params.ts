import { ERROR_CODES } from '@mbs/common';
import { ApiError } from '@/server/http/errors';
import { SAFE_PUBLIC_ID } from '@/shared/schemas';

/** Valida identificadores públicos (slugs e IDs opacos) antes de consultarlos. */
export function publicId(value: string): string {
  if (!SAFE_PUBLIC_ID.test(value)) throw new ApiError(404, ERROR_CODES.NOT_FOUND);
  return value;
}
