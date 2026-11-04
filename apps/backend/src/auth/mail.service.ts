import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from '../config/env.js';

/**
 * Envío de correos. En el MVP no hay proveedor SMTP configurado:
 * en desarrollo el enlace se muestra en la consola del servidor;
 * en producción no se registra el token (debe integrarse un proveedor real).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    if (this.config.get('NODE_ENV', { infer: true }) === 'development') {
      this.logger.log(`[DEV] Enlace de recuperación para ${email}: ${resetUrl}`);
      return;
    }
    this.logger.warn('Proveedor de correo no configurado: no se envió el correo de recuperación.');
  }
}
