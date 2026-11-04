import type { NextResponse } from 'next/server';
import { env, isProduction } from '../env';

export const ACCESS_COOKIE = 'mbs_at';
export const REFRESH_COOKIE = 'mbs_rt';
const REFRESH_PATH = '/api/v1/auth';

/**
 * Tokens en cookies HttpOnly (inaccesibles desde JavaScript: mitiga XSS) con
 * SameSite (mitiga CSRF) y Secure en producción. Nunca en localStorage.
 */
export function setAuthCookies(res: NextResponse, access: string, refresh: string): void {
  const secure = isProduction();
  res.cookies.set(ACCESS_COOKIE, access, {
    httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: env().JWT_ACCESS_TTL_MINUTES * 60,
  });
  res.cookies.set(REFRESH_COOKIE, refresh, {
    httpOnly: true, secure, sameSite: 'strict', path: REFRESH_PATH, maxAge: env().REFRESH_TOKEN_TTL_DAYS * 86_400,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  const secure = isProduction();
  res.cookies.set(ACCESS_COOKIE, '', { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { httpOnly: true, secure, sameSite: 'strict', path: REFRESH_PATH, maxAge: 0 });
}
