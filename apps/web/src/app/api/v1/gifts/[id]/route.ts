import { requireUser } from '@/server/auth/session';
import { json, noContent, readBody, route } from '@/server/http/handler';
import { deleteGift, getGift, updateGift } from '@/server/services/gifts.service';
import { updateGiftSchema } from '@/shared/schemas';
import { uuidParam } from '../_id';

type Params = { id: string };

export const GET = route<Params>(async (req, { id }) => {
  const user = await requireUser(req);
  return json(await getGift(user.id, uuidParam(id, 'GIFT_NOT_FOUND')));
});

export const PATCH = route<Params>(async (req, { id }) => {
  const user = await requireUser(req);
  return json(await updateGift(user.id, uuidParam(id, 'GIFT_NOT_FOUND'), await readBody(req, updateGiftSchema)));
});

export const DELETE = route<Params>(async (req, { id }) => {
  const user = await requireUser(req);
  await deleteGift(user.id, uuidParam(id, 'GIFT_NOT_FOUND'));
  return noContent();
});
