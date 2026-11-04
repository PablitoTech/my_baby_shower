import { requireUser } from '@/server/auth/session';
import { json, readBody, readQuery, route } from '@/server/http/handler';
import { createGift, listGifts } from '@/server/services/gifts.service';
import { createGiftSchema, giftFiltersSchema } from '@/shared/schemas';

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json(await listGifts(user.id, readQuery(req, giftFiltersSchema)));
});

export const POST = route(async (req) => {
  const user = await requireUser(req);
  return json(await createGift(user.id, await readBody(req, createGiftSchema)), 201);
});
