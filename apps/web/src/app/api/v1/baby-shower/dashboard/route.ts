import { requireUser } from '@/server/auth/session';
import { json, route } from '@/server/http/handler';
import { getDashboard } from '@/server/services/baby-shower.service';

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json(await getDashboard(user.id));
});
