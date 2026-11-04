import { requireUser } from '@/server/auth/session';
import { json, route } from '@/server/http/handler';
import { me } from '@/server/services/auth.service';

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json(await me(user.id));
});
