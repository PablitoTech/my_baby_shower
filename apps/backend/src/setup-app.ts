import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { mkdirSync } from 'node:fs';
import type { AppEnv } from './config/env.js';

/** Configuración HTTP compartida por main.ts y las pruebas de integración. */
export function setupApp(app: NestExpressApplication): INestApplication {
  const config = app.get(ConfigService<AppEnv, true>);
  const isProd = config.get('NODE_ENV', { infer: true }) === 'production';

  app.setGlobalPrefix('api');
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('FRONTEND_URL', { infer: true }).split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });
  app.useBodyParser('json', { limit: '100kb' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: isProd,
    }),
  );

  const uploads = config.get('UPLOADS_DIR', { infer: true });
  mkdirSync(uploads, { recursive: true });
  app.useStaticAssets(uploads, {
    prefix: '/uploads/',
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });
  app.enableShutdownHooks();
  return app;
}
