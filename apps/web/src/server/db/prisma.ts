import type { PrismaClient } from '../../generated/prisma/client';
import { env } from '../env';
import { createPrismaClient } from './client';

declare global {
  var __mbsPrisma: PrismaClient | undefined;
}

/** Instancia única (también entre recargas en desarrollo y entre invocaciones serverless). */
export function db(): PrismaClient {
  globalThis.__mbsPrisma ??= createPrismaClient(env().DATABASE_URL);
  return globalThis.__mbsPrisma;
}
