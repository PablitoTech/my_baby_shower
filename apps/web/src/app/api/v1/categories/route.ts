import { requireUser } from '@/server/auth/session';
import { json, route } from '@/server/http/handler';
import { listCategories } from '@/server/services/gifts.service';

export const GET = route(async (req) => {
  await requireUser(req);
  return json(await listCategories());
});
