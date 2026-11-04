import path from 'node:path';
import { config } from 'dotenv';

const root = path.resolve(import.meta.dirname, '..', '..', '..');

/**
 * Base de datos de pruebas: <DB_NAME>_test en el PostgreSQL local de Docker
 * (variables DB_* de .env). Nunca usa la base remota de DATABASE_URL.
 */
export function testDatabaseUrls() {
  const env = config({ path: path.join(root, '.env'), processEnv: {}, quiet: true }).parsed ?? {};
  const { DB_HOST = 'localhost', DB_PORT = '5432', DB_USER = '', DB_PASSWORD = '', DB_NAME = 'my_baby_shower' } = env;
  const auth = `${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}`;
  const base = `postgresql://${auth}@${DB_HOST}:${DB_PORT}`;
  return { root, admin: `${base}/${DB_NAME}`, testDbName: `${DB_NAME}_test`, test: `${base}/${DB_NAME}_test?schema=public` };
}
