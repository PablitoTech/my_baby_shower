import { ERROR_CODES } from '@mbs/common';
import { requireUser } from '@/server/auth/session';
import { ApiError } from '@/server/http/errors';
import { json, route } from '@/server/http/handler';
import { removeGiftImage, setGiftImage } from '@/server/services/gifts.service';
import { uuidParam } from '../../_id';

type Params = { id: string };

export const POST = route<Params>(async (req, { id }) => {
  const user = await requireUser(req);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, ERROR_CODES.INVALID_IMAGE);
  }
  return json(await setGiftImage(user.id, uuidParam(id, 'GIFT_NOT_FOUND'), form.get('image')));
});

export const DELETE = route<Params>(async (req, { id }) => {
  const user = await requireUser(req);
  return json(await removeGiftImage(user.id, uuidParam(id, 'GIFT_NOT_FOUND')));
});
