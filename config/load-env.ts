/**
 * Carga el perfil de variables de entorno local: `.env.<perfil>` en la raíz del monorepo.
 *
 *   APP_ENV=development | test | production   (si no se define, se deduce de NODE_ENV)
 *
 * - `next dev`              → development
 * - `next build` / `start`  → production
 * - pruebas de integración  → test
 * - CLI de Prisma           → development, salvo que se indique APP_ENV
 *
 * dotenv no sobrescribe variables ya definidas: en Vercel/CI las del entorno
 * mandan y estos archivos (no versionados) simplemente no existen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

export type EnvProfile = 'development' | 'test' | 'production';

const ROOT = path.resolve(import.meta.dirname, '..');

export function resolveProfile(): EnvProfile {
  const raw = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development';
  if (raw === 'production' || raw === 'prod') return 'production';
  if (raw === 'test') return 'test';
  return 'development';
}

export function loadEnv(profile: EnvProfile = resolveProfile()): EnvProfile {
  const file = path.join(ROOT, `.env.${profile}`);
  if (fs.existsSync(file)) config({ path: file, quiet: true });
  process.env.APP_ENV ??= profile;
  return profile;
}
