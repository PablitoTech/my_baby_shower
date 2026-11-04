import { defineConfig } from 'prisma/config';
import { loadEnv } from './config/load-env';

// Perfil local `.env.<APP_ENV>` (development por defecto). Ver config/load-env.ts.
loadEnv();

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
