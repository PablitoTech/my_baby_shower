import path from 'node:path';
import type { NextConfig } from 'next';
import { loadEnv } from '../../config/load-env';

const root = path.resolve(import.meta.dirname, '..', '..');

// Perfil local: `next dev` → .env.development, `next build`/`start` → .env.production.
// En Vercel las variables se definen en el panel del proyecto.
loadEnv();

const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
  // DENY en producción; SAMEORIGIN en desarrollo para poder previsualizar vistas móviles.
  { key: 'X-Frame-Options', value: isProd ? 'DENY' : 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Las librerías del monorepo se publican como TypeScript y Next las compila.
  transpilePackages: ['@mbs/common', '@mbs/contracts', '@mbs/shared'],
  // Módulo nativo: se carga desde node_modules en el runtime de Node.
  serverExternalPackages: ['argon2'],
  turbopack: { root },
  outputFileTracingRoot: root,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
