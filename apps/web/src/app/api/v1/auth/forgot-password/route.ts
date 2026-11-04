import { env } from '@/server/env';
import { clientIp, noContent, readBody, route } from '@/server/http/handler';
import { MINUTE, rateLimit } from '@/server/rate-limit';
import { forgotPassword } from '@/server/services/auth.service';
import { forgotPasswordSchema } from '@/shared/schemas';

export const POST = route(async (req) => {
  await rateLimit('forgot', clientIp(req), 3, MINUTE);
  const { email } = await readBody(req, forgotPasswordSchema);
  // Límite por correo: evita inundar el buzón de una persona con enlaces de recuperación.
  await rateLimit('forgot-account', email, 3, 60 * MINUTE);
  await forgotPassword(email, env().APP_URL ?? req.nextUrl.origin);
  return noContent();
});
