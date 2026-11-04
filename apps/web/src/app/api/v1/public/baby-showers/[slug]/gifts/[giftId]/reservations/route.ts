import { clientIp, json, readBody, route } from '@/server/http/handler';
import { MINUTE, rateLimit } from '@/server/rate-limit';
import { reserveGift } from '@/server/services/public.service';
import { createReservationSchema } from '@/shared/schemas';
import { publicId } from '../../../../../_params';

export const POST = route<{ slug: string; giftId: string }>(async (req, { slug, giftId }) => {
  const showerSlug = publicId(slug);
  await rateLimit('reserve', clientIp(req), 10, MINUTE);
  // Límite por Baby Shower: frena que un tercero agote la lista con reservas falsas.
  await rateLimit('reserve-shower', showerSlug, 60, 10 * MINUTE);
  const input = await readBody(req, createReservationSchema);
  return json(await reserveGift(showerSlug, publicId(giftId), input), 201);
});
