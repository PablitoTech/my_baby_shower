/**
 * Carga datos iniciales: categorías de regalos.
 * Idempotente: puede ejecutarse varias veces sin duplicar registros.
 */
import { loadEnv } from '../config/load-env';
import { createPrismaClient } from '../apps/web/src/server/db/client';

loadEnv();

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
  const prisma = createPrismaClient(process.env.DATABASE_URL ?? '');
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
