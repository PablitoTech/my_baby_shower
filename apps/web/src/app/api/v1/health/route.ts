import { ERROR_CODES } from '@mbs/common';
import { db } from '@/server/db/prisma';
import { ApiError } from '@/server/http/errors';
import { json, route } from '@/server/http/handler';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  try {
    await db().$queryRaw`SELECT 1`;
  } catch {
    throw new ApiError(503, ERROR_CODES.INTERNAL_ERROR, 'Database unavailable');
  }
  return json({ status: 'ok', database: 'up' });
});
