import { execSync } from 'node:child_process';
import pg from 'pg';
import { testDatabaseUrls } from './test-db';

/** Crea la base de pruebas si no existe y aplica migraciones y seed. */
export default async function setup(): Promise<void> {
  const urls = testDatabaseUrls();
  const admin = new pg.Client({ connectionString: urls.admin });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [urls.testDbName]);
  if (exists.rowCount === 0) await admin.query(`CREATE DATABASE "${urls.testDbName}"`);
  await admin.end();

  const env = { ...process.env, DATABASE_URL: urls.test };
  execSync('npx prisma migrate deploy', { cwd: urls.root, env, stdio: 'ignore' });
  execSync('npx prisma db seed', { cwd: urls.root, env, stdio: 'ignore' });
}
