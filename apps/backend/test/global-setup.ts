/**
 * Prepara una base de datos PostgreSQL exclusiva para pruebas de integración
 * (<DB_NAME>_test) dentro del mismo contenedor de desarrollo y aplica las migraciones.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';

const root = path.resolve(import.meta.dirname, '..', '..', '..');

export default async function setup(): Promise<void> {
  const env = config({ path: path.join(root, 'environment.m'), processEnv: {}, quiet: true }).parsed ?? {};
  const { DB_HOST = 'localhost', DB_PORT = '5432', DB_USER, DB_PASSWORD, DB_NAME } = env;
  const testDb = `${DB_NAME}_test`;
  const auth = `${encodeURIComponent(DB_USER!)}:${encodeURIComponent(DB_PASSWORD!)}`;

  const admin = new pg.Client({ connectionString: `postgresql://${auth}@${DB_HOST}:${DB_PORT}/${DB_NAME}` });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [testDb]);
  if (exists.rowCount === 0) await admin.query(`CREATE DATABASE "${testDb}"`);
  await admin.end();

  const url = `postgresql://${auth}@${DB_HOST}:${DB_PORT}/${testDb}?schema=public`;
  process.env.TEST_DATABASE_URL = url;
  const childEnv = { ...process.env, DATABASE_URL: url };
  execSync('npx prisma migrate deploy', { cwd: root, env: childEnv, stdio: 'ignore' });
  execSync('npx prisma db seed', { cwd: root, env: childEnv, stdio: 'ignore' });
}
