import { ERROR_CODES, IMAGE_UPLOAD } from '@mbs/common';
import { requireUser } from '@/server/auth/session';
import { ApiError } from '@/server/http/errors';
import { json, readFormData, route } from '@/server/http/handler';
import { removeGiftImage, setGiftImage } from '@/server/services/gifts.service';
import { uuidParam } from '../../_id';

type Params = { id: string };

/** Margen para las cabeceras del multipart además de la imagen. */
const MULTIPART_OVERHEAD = 64 * 1024;

export const POST = route<Params>(async (req, { id }) => {
  const user = await requireUser(req);
  let form: FormData;
  try {
    form = await readFormData(req, IMAGE_UPLOAD.MAX_BYTES + MULTIPART_OVERHEAD);
  } catch (error) {
    if (error instanceof ApiError) throw new ApiError(413, ERROR_CODES.INVALID_IMAGE);
    throw new ApiError(400, ERROR_CODES.INVALID_IMAGE);
  }
  return json(await setGiftImage(user.id, uuidParam(id, 'GIFT_NOT_FOUND'), form.get('image')));
});

export const DELETE = route<Params>(async (req, { id }) => {
  const user = await requireUser(req);
  return json(await removeGiftImage(user.id, uuidParam(id, 'GIFT_NOT_FOUND')));
});
