import type { NextRequest } from 'next/server';
import { ERROR_CODES } from '@mbs/common';
import type { UserRole } from '@mbs/contracts';
import { ApiError } from '../http/errors';
import { ACCESS_COOKIE } from './cookies';
import { verifyAccessToken } from './jwt';

export interface RequestUser {
  id: string;
  role: UserRole;
}

/** Exige una sesión válida (cookie de acceso). Lanza 401 si no existe o expiró. */
export async function requireUser(req: NextRequest, roles?: UserRole[]): Promise<RequestUser> {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) throw new ApiError(401, ERROR_CODES.UNAUTHORIZED);
  const payload = await verifyAccessToken(token);
  if (!payload) throw new ApiError(401, ERROR_CODES.AUTH_SESSION_EXPIRED);
  if (roles?.length && !roles.includes(payload.role)) throw new ApiError(403, ERROR_CODES.FORBIDDEN);
  return { id: payload.sub, role: payload.role };
}
