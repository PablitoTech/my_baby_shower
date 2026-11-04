import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  /** URL pública de la app. */
  APP_URL: z.url().optional(),
  /** Orígenes adicionales permitidos para peticiones que modifican datos (separados por coma). */
  ALLOWED_ORIGINS: z.string().optional(),
  RATE_LIMIT_DISABLED: z.enum(['true', 'false']).default('false'),

});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Variables de entorno validadas (se evalúan al primer uso, no durante el build). */
export function env(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Configuración inválida: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export const isProduction = () => env().NODE_ENV === 'production';
