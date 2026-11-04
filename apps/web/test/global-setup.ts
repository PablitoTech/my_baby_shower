import { execSync } from 'node:child_process';
import { loadTestEnv } from './test-env';

/** Aplica migraciones y seed al esquema de pruebas (Prisma crea el esquema si no existe). */
export default async function setup(): Promise<void> {
  const { root, databaseUrl } = loadTestEnv();
  const env = { ...process.env, APP_ENV: 'test', DATABASE_URL: databaseUrl };
  execSync('npx prisma migrate deploy', { cwd: root, env, stdio: 'ignore' });
  execSync('npx prisma db seed', { cwd: root, env, stdio: 'ignore' });
}
