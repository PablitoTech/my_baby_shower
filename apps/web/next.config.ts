import path from 'node:path';
import type { NextConfig } from 'next';
import { loadEnv } from '../../config/load-env';

const root = path.resolve(import.meta.dirname, '..', '..');

// Perfil local: `next dev` → .env.development, `next build`/`start` → .env.production.
// En Vercel las variables se definen en el panel del proyecto.
loadEnv();

const isProd = process.env.NODE_ENV === 'production';

/**
 * Content-Security-Policy: solo recursos del propio dominio. No se cargan
 * scripts, estilos, fuentes ni imágenes de terceros (next/font aloja las
 * fuentes localmente). 'unsafe-inline' en scripts es necesario para la
 * hidratación de Next sin nonces; en desarrollo se añade lo que pide el HMR.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isProd ? '' : ' ws: wss:'}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  `frame-ancestors ${isProd ? "'none'" : "'self'"}`,
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // DENY en producción; SAMEORIGIN en desarrollo para poder previsualizar vistas móviles.
  { key: 'X-Frame-Options', value: isProd ? 'DENY' : 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
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
