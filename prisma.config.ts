import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// En local las variables y credenciales se cargan de `.env` (no versionado).
// En Vercel/CI llegan como variables de entorno del proyecto.
config({ path: path.resolve(import.meta.dirname, '.env'), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // `prisma generate` no necesita conexión, por eso se permite vacío.
    url: process.env.DATABASE_URL ?? '',
  },
});
