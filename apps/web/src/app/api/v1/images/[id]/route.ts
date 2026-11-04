import { ERROR_CODES } from '@mbs/common';
import { requireUser } from '@/server/auth/session';
import { ApiError } from '@/server/http/errors';
import { route } from '@/server/http/handler';
import { getImage } from '@/server/services/gifts.service';
import { uuidParam } from '../../gifts/_id';

/**
 * Sirve la imagen de un regalo.
 * - Baby Shower publicado: imagen pública (la ven los invitados).
 * - No publicado: solo su dueño (con sesión); para el resto responde 404.
 * El ID cambia con cada imagen nueva, así que puede cachearse sin quedar obsoleta.
 */
export const GET = route<{ id: string }>(async (req, { id }) => {
  const image = await getImage(uuidParam(id));
  const shower = image?.gift.babyShower;
  if (!image || !shower || shower.status !== 'ACTIVE') throw new ApiError(404, ERROR_CODES.NOT_FOUND);

  const isPublic = shower.isPublished;
  if (!isPublic) {
    const user = await requireUser(req).catch(() => null);
    if (user?.id !== shower.userId) throw new ApiError(404, ERROR_CODES.NOT_FOUND);
  }

  return new Response(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.mimeType,
      'Content-Length': String(image.sizeBytes),
      // Privadas: solo caché del navegador del dueño. Públicas: caché inmutable.
      'Cache-Control': isPublic ? 'public, max-age=31536000, immutable' : 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  });
});
