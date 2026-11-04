/**
 * Aplica las migraciones de Prisma durante el build de Vercel.
 *
 * - Solo en el entorno Production de Vercel (VERCEL_ENV=production). En los
 *   Preview Deployments (ramas y PRs) NO migra, para que una rama de prueba
 *   nunca modifique la base de producción.
 * - `prisma migrate deploy` solo aplica migraciones pendientes; nunca borra ni
 *   resetea la base (a diferencia de `migrate dev`).
 * - Después ejecuta el seed, que es idempotente (solo asegura las categorías).
 * - Si falla, el build falla y Vercel mantiene el despliegue anterior.
 *
 * Para forzarlo en otro entorno: RUN_MIGRATIONS=true.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const vercelEnv = process.env.VERCEL_ENV;
const forced = process.env.RUN_MIGRATIONS === 'true';

if (vercelEnv !== 'production' && !forced) {
  console.log(`[migrate] Se omiten las migraciones (VERCEL_ENV=${vercelEnv ?? 'local'}).`);
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error('[migrate] Falta DATABASE_URL en las variables de entorno de Vercel (Production).');
  process.exit(1);
}

const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit', env: { ...process.env, APP_ENV: 'production' } });

console.log('[migrate] Aplicando migraciones pendientes…');
run('npx prisma migrate deploy');
console.log('[migrate] Ejecutando seed (idempotente)…');
run('npx prisma db seed');
console.log('[migrate] Base de datos lista.');
