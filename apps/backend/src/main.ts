import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import type { AppEnv } from './config/env.js';
import { setupApp } from './setup-app.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  setupApp(app);

  const config = app.get(ConfigService<AppEnv, true>);
  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('my_baby_shower API')
        .setDescription('API REST para la gestión de Baby Showers, regalos y reservas.')
        .setVersion('0.1.0')
        .addCookieAuth('mbs_at')
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.get('API_PORT', { infer: true });
  await app.listen(port);
  new Logger('Bootstrap').log(`API disponible en http://localhost:${port}/api`);
}

await bootstrap();
