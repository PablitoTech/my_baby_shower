import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

const SCHEMA_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/;

export interface ParsedDatabaseUrl {
  connectionString: string;
  schema: string;
  sslmode: string | null;
}

/**
 * Separa los parámetros que entiende Prisma CLI (`schema`, `sslmode`) de la
 * cadena que recibe el driver `pg`, que los interpreta de otra forma.
 */
export function parseDatabaseUrl(url: string): ParsedDatabaseUrl {
  const u = new URL(url);
  const schema = u.searchParams.get('schema') ?? 'public';
  if (!SCHEMA_NAME.test(schema)) throw new Error('Nombre de esquema inválido en DATABASE_URL');
  const sslmode = u.searchParams.get('sslmode');
  for (const key of ['schema', 'sslmode', 'sslrootcert', 'uselibpqcompat']) u.searchParams.delete(key);
  return { connectionString: u.toString(), schema, sslmode };
}

/**
 * Crea un PrismaClient con el adaptador `pg`.
 * - `search_path` apunta al esquema de la URL (las consultas SQL crudas lo usan).
 * - SSL: si `sslmode` está activo se cifra la conexión. Con `DATABASE_CA_CERT`
 *   (PEM del proveedor, p. ej. Aiven) además se verifica el certificado.
 */
export function createPrismaClient(url: string): PrismaClient {
  const { connectionString, schema, sslmode: explicitSslmode } = parseDatabaseUrl(url);
  // Hosts remotos sin sslmode explícito: se cifra igualmente (Aiven y la mayoría lo exigen).
  const host = new URL(connectionString).hostname;
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);
  const sslmode = explicitSslmode ?? (isLocal ? null : 'require');
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n');
  const ssl =
    !sslmode || sslmode === 'disable'
      ? undefined
      : ca
        ? { ca, rejectUnauthorized: true }
        : { rejectUnauthorized: sslmode === 'verify-full' };

  if (ssl && !ssl.rejectUnauthorized && process.env.NODE_ENV === 'production') {
    console.warn('[db] TLS sin verificación de certificado: define DATABASE_CA_CERT con el CA del proveedor.');
  }

  const adapter = new PrismaPg(
    {
      connectionString,
      ssl,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idleTimeoutMillis: 10_000,
      options: `-c search_path="${schema}"`,
    },
    { schema },
  );
  return new PrismaClient({ adapter });
}
