import { ERROR_CODES } from '@mbs/common';
import { db } from './db/prisma';
import { env } from './env';
import { ApiError } from './http/errors';

/**
 * Rate limiting de ventana fija persistido en PostgreSQL. Funciona con varias
 * instancias serverless porque el contador no vive en memoria. La operación
 * es atómica (INSERT ... ON CONFLICT DO UPDATE).
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  if (env().RATE_LIMIT_DISABLED === 'true') return;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const [row] = await db().$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limits (key, count, reset_at) VALUES (${key}, 1, ${resetAt})
    ON CONFLICT (key) DO UPDATE SET
      count    = CASE WHEN rate_limits.reset_at <= ${now} THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at <= ${now} THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
    RETURNING count`;

  // Limpieza ocasional de ventanas vencidas.
  if (Math.random() < 0.02) {
    void db().rateLimit.deleteMany({ where: { resetAt: { lt: now } } }).catch(() => undefined);
  }
  if ((row?.count ?? 0) > limit) {
    throw new ApiError(429, ERROR_CODES.TOO_MANY_REQUESTS, 'Too many requests');
  }
}

export const MINUTE = 60_000;
