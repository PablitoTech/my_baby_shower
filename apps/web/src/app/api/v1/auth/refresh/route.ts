import { REFRESH_COOKIE, clearAuthCookies } from '@/server/auth/cookies';
import { clientIp, errorResponse, route } from '@/server/http/handler';
import { MINUTE, rateLimit } from '@/server/rate-limit';
import { refresh } from '@/server/services/auth.service';
import { sessionContext, withSession } from '../_shared';

export const POST = route(async (req) => {
  await rateLimit(`refresh:${clientIp(req)}`, 30, MINUTE);
  try {
    return withSession(await refresh(req.cookies.get(REFRESH_COOKIE)?.value, sessionContext(req)));
  } catch (error) {
    const res = errorResponse(error);
    clearAuthCookies(res);
    return res;
  }
});
