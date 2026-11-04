import { requireUser } from '@/server/auth/session';
import { json, route } from '@/server/http/handler';
import { publishBabyShower } from '@/server/services/baby-shower.service';

export const POST = route(async (req) => {
  const user = await requireUser(req);
  return json(await publishBabyShower(user.id));
});
