import type { NextRequest } from 'next/server';
import { ERROR_CODES } from '@mbs/common';
import type { UserRole } from '@mbs/contracts';
import { db } from '../db/prisma';
import { ApiError } from '../http/errors';
import { ACCESS_COOKIE } from './cookies';
import { verifyAccessToken } from './jwt';

export interface RequestUser {
  id: string;
  role: UserRole;
}

/**
 * Exige una sesión válida: JWT firmado y vigente + sesión no revocada en BD +
 * usuario activo. Así el cierre de sesión, la rotación del refresh token o un
 * cambio de contraseña invalidan el token de acceso de inmediato.
 */
export async function requireUser(req: NextRequest, roles?: UserRole[]): Promise<RequestUser> {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) throw new ApiError(401, ERROR_CODES.UNAUTHORIZED);
  const payload = await verifyAccessToken(token);
  if (!payload) throw new ApiError(401, ERROR_CODES.AUTH_SESSION_EXPIRED);
  const session = await db().session.findFirst({
    where: { id: payload.sid, userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() }, user: { status: 'ACTIVE' } },
    select: { id: true },
  });
  if (!session) throw new ApiError(401, ERROR_CODES.AUTH_SESSION_EXPIRED);
  if (roles?.length && !roles.includes(payload.role)) throw new ApiError(403, ERROR_CODES.FORBIDDEN);
  return { id: payload.sub, role: payload.role };
}
