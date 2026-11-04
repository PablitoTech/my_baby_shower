import { ERROR_CODES } from '@mbs/common';
import type { AuthUser } from '@mbs/contracts';
import type { z } from 'zod';
import type { User } from '../../generated/prisma/client';
import type { loginSchema, registerSchema, resetPasswordSchema } from '../../shared/schemas';
import { hashPassword, verifyDummy, verifyPassword } from '../auth/password';
import { signAccessToken } from '../auth/jwt';
import { randomToken, sha256 } from '../crypto';
import { db } from '../db/prisma';
import { env } from '../env';
import { ApiError } from '../http/errors';
import { sendPasswordResetEmail } from '../mail';

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

export interface SessionContext {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface IssuedTokens {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const toAuthUser = (u: User): AuthUser => ({ id: u.id, email: u.email, username: u.username, role: u.role });

async function issueTokens(user: User, ctx: SessionContext): Promise<IssuedTokens> {
  const refreshToken = randomToken(48);
  const session = await db().session.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + env().REFRESH_TOKEN_TTL_DAYS * 86_400_000),
      userAgent: ctx.userAgent?.slice(0, 255),
      ipAddress: ctx.ipAddress?.slice(0, 45),
    },
  });
  const accessToken = await signAccessToken({ sub: user.id, role: user.role, sid: session.id });
  return { user: toAuthUser(user), accessToken, refreshToken };
}

async function revokeAllSessions(userId: string): Promise<void> {
  await db().session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

/** Crea la cuenta y su Baby Shower en una única operación. */
export async function register(input: z.output<typeof registerSchema>, ctx: SessionContext): Promise<IssuedTokens> {
  const existing = await db().user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
    select: { email: true },
  });
  if (existing) {
    throw new ApiError(409, existing.email === input.email ? ERROR_CODES.AUTH_EMAIL_TAKEN : ERROR_CODES.AUTH_USERNAME_TAKEN);
  }
  const user = await db().user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash: await hashPassword(input.password),
      babyShower: {
        create: {
          babyName: input.babyName,
          fatherName: input.fatherName,
          motherName: input.motherName,
          eventDate: new Date(input.eventDate),
          description: input.description ?? null,
        },
      },
    },
  });
  return issueTokens(user, ctx);
}

export async function login(input: z.output<typeof loginSchema>, ctx: SessionContext): Promise<IssuedTokens> {
  const user = await db().user.findFirst({
    where: { OR: [{ email: input.identifier }, { username: input.identifier }] },
  });
  if (!user || user.status !== 'ACTIVE') {
    await verifyDummy(input.password);
    throw new ApiError(401, ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError(401, ERROR_CODES.AUTH_ACCOUNT_LOCKED);
  }
  if (!(await verifyPassword(user.passwordHash, input.password))) {
    const attempts = user.failedLoginAttempts + 1;
    const lock = attempts >= MAX_FAILED_LOGINS;
    await db().user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : user.lockedUntil,
      },
    });
    if (lock) console.warn(`[auth] Cuenta bloqueada temporalmente por intentos fallidos: ${user.id}`);
    throw new ApiError(401, lock ? ERROR_CODES.AUTH_ACCOUNT_LOCKED : ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }
  const updated = await db().user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  return issueTokens(updated, ctx);
}

/** Rota el refresh token. Si se reutiliza uno revocado, se cierran todas las sesiones. */
export async function refresh(token: string | undefined, ctx: SessionContext): Promise<IssuedTokens> {
  if (!token) throw new ApiError(401, ERROR_CODES.AUTH_SESSION_EXPIRED);
  const session = await db().session.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!session) throw new ApiError(401, ERROR_CODES.AUTH_SESSION_EXPIRED);
  if (session.revokedAt) {
    console.warn(`[auth] Reutilización de refresh token detectada; revocando sesiones de ${session.userId}`);
    await revokeAllSessions(session.userId);
    throw new ApiError(401, ERROR_CODES.AUTH_SESSION_EXPIRED);
  }
  if (session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') {
    throw new ApiError(401, ERROR_CODES.AUTH_SESSION_EXPIRED);
  }
  // updateMany con revokedAt: null evita que dos refrescos simultáneos roten el mismo token.
  const { count } = await db().session.updateMany({
    where: { id: session.id, revokedAt: null },
    data: { revokedAt: new Date(), lastUsedAt: new Date() },
  });
  if (count === 0) throw new ApiError(401, ERROR_CODES.AUTH_SESSION_EXPIRED);
  return issueTokens(session.user, ctx);
}

export async function logout(token: string | undefined): Promise<void> {
  if (!token) return;
  await db().session.updateMany({ where: { tokenHash: sha256(token), revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function me(userId: string): Promise<AuthUser> {
  const user = await db().user.findUnique({ where: { id: userId } });
  if (!user || user.status !== 'ACTIVE') throw new ApiError(401, ERROR_CODES.UNAUTHORIZED);
  return toAuthUser(user);
}

/** Siempre responde igual, exista o no el correo (evita enumeración de cuentas). */
export async function forgotPassword(email: string, appUrl: string): Promise<void> {
  const user = await db().user.findUnique({ where: { email } });
  if (!user || user.status !== 'ACTIVE') return;
  const token = randomToken(32);
  await db().$transaction([
    db().passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    db().passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + env().PASSWORD_RESET_TTL_MINUTES * 60_000),
      },
    }),
  ]);
  await sendPasswordResetEmail(user.email, `${appUrl}/reset-password?token=${encodeURIComponent(token)}`);
}

export async function resetPassword(input: z.output<typeof resetPasswordSchema>): Promise<void> {
  const record = await db().passwordResetToken.findUnique({ where: { tokenHash: sha256(input.token) } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    throw new ApiError(400, ERROR_CODES.AUTH_INVALID_RESET_TOKEN);
  }
  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  await db().$transaction([
    db().passwordResetToken.update({ where: { id: record.id }, data: { usedAt: now } }),
    db().user.update({ where: { id: record.userId }, data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null } }),
    db().session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: now } }),
  ]);
}
