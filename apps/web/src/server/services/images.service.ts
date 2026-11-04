import { ERROR_CODES, IMAGE_UPLOAD } from '@mbs/common';
import { ApiError } from '../http/errors';

export type ImageMime = (typeof IMAGE_UPLOAD.MIME_TYPES)[number];

/** Detecta el tipo real por la firma binaria (no confía en el nombre ni en el MIME declarado). */
export function detectImageMime(bytes: Uint8Array): ImageMime | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((b, i) => bytes[i] === b)) return 'image/png';
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/** Valida un archivo subido y devuelve sus bytes y su tipo real. */
export async function readImageUpload(file: FormDataEntryValue | null): Promise<{ data: Uint8Array<ArrayBuffer>; mimeType: ImageMime }> {
  if (!(file instanceof File) || file.size === 0 || file.size > IMAGE_UPLOAD.MAX_BYTES) {
    throw new ApiError(400, ERROR_CODES.INVALID_IMAGE);
  }
  const data = new Uint8Array(await file.arrayBuffer());
  const mimeType = detectImageMime(data);
  if (!mimeType) throw new ApiError(400, ERROR_CODES.INVALID_IMAGE);
  return { data, mimeType };
}
