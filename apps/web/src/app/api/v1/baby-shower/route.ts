import { requireUser } from '@/server/auth/session';
import { json, readBody, route } from '@/server/http/handler';
import { getBabyShower, updateBabyShower } from '@/server/services/baby-shower.service';
import { updateBabyShowerSchema } from '@/shared/schemas';

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json(await getBabyShower(user.id));
});

export const PATCH = route(async (req) => {
  const user = await requireUser(req);
  return json(await updateBabyShower(user.id, await readBody(req, updateBabyShowerSchema)));
});
