import { clientIp, json, readBody, route } from '@/server/http/handler';
import { MINUTE, rateLimit } from '@/server/rate-limit';
import { reserveGift } from '@/server/services/public.service';
import { createReservationSchema } from '@/shared/schemas';
import { publicId } from '../../../../../_params';

export const POST = route<{ slug: string; giftId: string }>(async (req, { slug, giftId }) => {
  await rateLimit(`reserve:${clientIp(req)}`, 10, MINUTE);
  const input = await readBody(req, createReservationSchema);
  return json(await reserveGift(publicId(slug), publicId(giftId), input), 201);
});
