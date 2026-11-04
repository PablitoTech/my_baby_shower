import { clientIp, readBody, route } from '@/server/http/handler';
import { MINUTE, rateLimit } from '@/server/rate-limit';
import { login } from '@/server/services/auth.service';
import { loginSchema } from '@/shared/schemas';
import { sessionContext, withSession } from '../_shared';

export const POST = route(async (req) => {
  await rateLimit(`login:${clientIp(req)}`, 5, MINUTE);
  const input = await readBody(req, loginSchema);
  return withSession(await login(input, sessionContext(req)));
});
