import { env } from './env';

/**
 * Envío de correos. El MVP no tiene proveedor configurado: en desarrollo el
 * enlace se muestra en la consola; en producción nunca se registra el token.
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  if (env().NODE_ENV === 'development') {
    console.info(`[mail][DEV] Enlace de recuperación para ${email}: ${resetUrl}`);
    return;
  }
  console.warn('[mail] Proveedor de correo no configurado: no se envió el correo de recuperación.');
}
