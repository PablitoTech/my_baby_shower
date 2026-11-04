import type { CookieOptions, Response } from 'express';

export const ACCESS_COOKIE = 'mbs_at';
export const REFRESH_COOKIE = 'mbs_rt';
const REFRESH_PATH = '/api/auth';

export interface CookieSettings {
  secure: boolean;
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
}

/**
 * Los tokens se envían en cookies HttpOnly: no son accesibles desde JavaScript
 * (mitiga XSS) y SameSite limita su envío en peticiones de otros sitios (mitiga CSRF).
 */
export function setAuthCookies(res: Response, access: string, refresh: string, s: CookieSettings): void {
  const base: CookieOptions = { httpOnly: true, secure: s.secure };
  res.cookie(ACCESS_COOKIE, access, { ...base, sameSite: 'lax', path: '/', maxAge: s.accessMaxAgeMs });
  res.cookie(REFRESH_COOKIE, refresh, { ...base, sameSite: 'strict', path: REFRESH_PATH, maxAge: s.refreshMaxAgeMs });
}

export function clearAuthCookies(res: Response, secure: boolean): void {
  res.clearCookie(ACCESS_COOKIE, { httpOnly: true, secure, sameSite: 'lax', path: '/' });
  res.clearCookie(REFRESH_COOKIE, { httpOnly: true, secure, sameSite: 'strict', path: REFRESH_PATH });
}
