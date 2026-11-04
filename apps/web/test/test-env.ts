import path from 'node:path';
import { config } from 'dotenv';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');

/**
 * Carga `.env.test` y verifica que apunte a un esquema o base de pruebas.
 * Las pruebas borran datos: se niegan a ejecutarse contra cualquier otra base.
 */
export function loadTestEnv(): { root: string; databaseUrl: string } {
  config({ path: path.join(ROOT, '.env.test'), quiet: true, override: true });
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Falta DATABASE_URL en .env.test');
  const url = new URL(databaseUrl);
  const schema = url.searchParams.get('schema') ?? 'public';
  const database = url.pathname.slice(1);
  if (!schema.endsWith('_test') && !database.endsWith('_test')) {
    throw new Error(`Por seguridad, las pruebas solo corren contra un esquema o base "*_test" (actual: ${database}/${schema}).`);
  }
  return { root: ROOT, databaseUrl };
}
