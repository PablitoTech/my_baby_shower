import type { NextRequest } from 'next/server';
import type { AuthUser } from '@mbs/contracts';
import { setAuthCookies } from '@/server/auth/cookies';
import { clientIp, json } from '@/server/http/handler';
import type { IssuedTokens, SessionContext } from '@/server/services/auth.service';

export const sessionContext = (req: NextRequest): SessionContext => ({
  userAgent: req.headers.get('user-agent'),
  ipAddress: clientIp(req),
});

/** Responde con el usuario y deja los tokens en cookies HttpOnly. */
export function withSession(tokens: IssuedTokens, status = 200) {
  const res = json<AuthUser>(tokens.user, status);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  return res;
}
