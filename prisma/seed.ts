/**
 * Carga datos iniciales: categorías de regalos.
 * Idempotente: puede ejecutarse varias veces sin duplicar registros.
 */
import path from 'node:path';
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../apps/backend/src/generated/prisma/client.js';

config({ path: path.resolve(import.meta.dirname, '..', 'environment.m'), quiet: true });

const CATEGORIES = [
  'HYGIENE',
  'CLOTHING',
  'FEEDING',
  'FURNITURE',
  'BATH',
  'SLEEP',
  'TOYS',
  'HEALTH',
  'OUTINGS',
  'OTHER',
] as const;

async function main(): Promise<void> {
  const adapter = new PrismaPg(
    { connectionString: process.env.DATABASE_URL },
    { schema: process.env.DB_SCHEMA ?? 'public' },
  );
  const prisma = new PrismaClient({ adapter });
  try {
    for (const [index, code] of CATEGORIES.entries()) {
      await prisma.category.upsert({
        where: { code },
        update: { sortOrder: index },
        create: { code, sortOrder: index },
      });
    }
    console.log(`Categorías sembradas: ${CATEGORIES.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
