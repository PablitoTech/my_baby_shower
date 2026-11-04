import { createHash, randomBytes, randomInt } from 'node:crypto';

/** Token aleatorio de alta entropía (base64url). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Hash SHA-256 en hexadecimal: los tokens se guardan sin almacenarlos en claro. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const LOWER_ALNUM = 'abcdefghijkmnpqrstuvwxyz23456789';
const UPPER_ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomFrom(alphabet: string, length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

/** Sufijo no predecible para enlaces públicos (≈ 50 bits de entropía). */
export const randomSlugSuffix = (length = 10) => randomFrom(LOWER_ALNUM, length);

/** Código de confirmación legible para invitados (sin caracteres ambiguos). */
export const randomConfirmationCode = (length = 8) => randomFrom(UPPER_ALNUM, length);

/** Identificador público opaco. */
export const randomPublicId = () => randomToken(12);
