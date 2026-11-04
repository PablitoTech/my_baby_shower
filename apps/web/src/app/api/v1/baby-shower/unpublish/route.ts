import { requireUser } from '@/server/auth/session';
import { json, route } from '@/server/http/handler';
import { unpublishBabyShower } from '@/server/services/baby-shower.service';

export const POST = route(async (req) => {
  const user = await requireUser(req);
  return json(await unpublishBabyShower(user.id));
});
