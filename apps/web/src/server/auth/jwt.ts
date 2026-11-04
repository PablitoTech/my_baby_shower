import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@mbs/contracts';
import { env } from '../env';

const ISSUER = 'my_baby_shower';

export interface AccessPayload {
  sub: string;
  role: UserRole;
}

const secret = () => new TextEncoder().encode(env().JWT_ACCESS_SECRET);

export function signAccessToken(payload: AccessPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${env().JWT_ACCESS_TTL_MINUTES}m`)
    .sign(secret());
}

export async function verifyAccessToken(token: string): Promise<AccessPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER, algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string') return null;
    return { sub: payload.sub, role: payload['role'] as UserRole };
  } catch {
    return null;
  }
}
