import { REFRESH_COOKIE, clearAuthCookies } from '@/server/auth/cookies';
import { noContent, route } from '@/server/http/handler';
import { logout } from '@/server/services/auth.service';

export const POST = route(async (req) => {
  await logout(req.cookies.get(REFRESH_COOKIE)?.value);
  const res = noContent();
  clearAuthCookies(res);
  return res;
});
