import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { AppEnv } from '../config/env.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { MailService } from './mail.service.js';
import { PasswordService } from './password.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv, true>) => ({
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
        signOptions: {
          expiresIn: config.get('JWT_ACCESS_TTL', { infer: true }) as `${number}m`,
          algorithm: 'HS256',
          issuer: 'my_baby_shower',
        },
        verifyOptions: { algorithms: ['HS256'], issuer: 'my_baby_shower' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, MailService],
  exports: [PasswordService],
})
export class AuthModule {}
