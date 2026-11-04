import { clientIp, readBody, route } from '@/server/http/handler';
import { MINUTE, rateLimit } from '@/server/rate-limit';
import { register } from '@/server/services/auth.service';
import { registerSchema } from '@/shared/schemas';
import { sessionContext, withSession } from '../_shared';

export const POST = route(async (req) => {
  await rateLimit('register', clientIp(req), 5, MINUTE);
  const input = await readBody(req, registerSchema);
  return withSession(await register(input, sessionContext(req)), 201);
});
