import path from 'node:path';

/** Ruta al archivo de entorno (environment.m en la raíz del monorepo). */
export const ENV_FILE_PATH =
  process.env.ENV_FILE ?? path.resolve(import.meta.dirname, '..', '..', '..', '..', 'environment.m');

export interface AppEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  API_PORT: number;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  DB_SCHEMA: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TTL: string;
  REFRESH_TOKEN_TTL_DAYS: number;
  PASSWORD_RESET_TTL_MINUTES: number;
  UPLOADS_DIR: string;
}

function required(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Variable de entorno requerida no definida: ${key}`);
  }
  return value;
}

function positiveInt(config: Record<string, unknown>, key: string, fallback: number): number {
  const raw = config[key];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`La variable ${key} debe ser un entero positivo`);
  }
  return value;
}

/** Valida y normaliza las variables de entorno al arrancar la aplicación. */
export function validateEnv(config: Record<string, unknown>): AppEnv {
  const nodeEnv = (config['NODE_ENV'] as string) ?? 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV debe ser development, production o test');
  }
  const jwtSecret = required(config, 'JWT_ACCESS_SECRET');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET debe tener al menos 32 caracteres');
  }
  return {
    NODE_ENV: nodeEnv as AppEnv['NODE_ENV'],
    API_PORT: positiveInt(config, 'API_PORT', 3000),
    FRONTEND_URL: required(config, 'FRONTEND_URL'),
    DATABASE_URL: required(config, 'DATABASE_URL'),
    DB_SCHEMA: (config['DB_SCHEMA'] as string) || 'public',
    JWT_ACCESS_SECRET: jwtSecret,
    JWT_ACCESS_TTL: (config['JWT_ACCESS_TTL'] as string) || '15m',
    REFRESH_TOKEN_TTL_DAYS: positiveInt(config, 'REFRESH_TOKEN_TTL_DAYS', 7),
    PASSWORD_RESET_TTL_MINUTES: positiveInt(config, 'PASSWORD_RESET_TTL_MINUTES', 30),
    UPLOADS_DIR:
      (config['UPLOADS_DIR'] as string) || path.resolve(import.meta.dirname, '..', '..', 'uploads'),
  };
}
