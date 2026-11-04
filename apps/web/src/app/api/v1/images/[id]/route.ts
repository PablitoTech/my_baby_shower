import { ERROR_CODES } from '@mbs/common';
import { ApiError } from '@/server/http/errors';
import { route } from '@/server/http/handler';
import { getImage } from '@/server/services/gifts.service';
import { uuidParam } from '../../gifts/_id';

/**
 * Sirve la imagen de un regalo. El ID cambia con cada nueva imagen, así que
 * puede cachearse indefinidamente. Se envía con nosniff y CSP restrictiva.
 */
export const GET = route<{ id: string }>(async (_req, { id }) => {
  const image = await getImage(uuidParam(id));
  if (!image) throw new ApiError(404, ERROR_CODES.NOT_FOUND);
  return new Response(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.mimeType,
      'Content-Length': String(image.sizeBytes),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
});
