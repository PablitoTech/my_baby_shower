import { clientIp, noContent, readBody, route } from '@/server/http/handler';
import { MINUTE, rateLimit } from '@/server/rate-limit';
import { resetPassword } from '@/server/services/auth.service';
import { resetPasswordSchema } from '@/shared/schemas';

export const POST = route(async (req) => {
  await rateLimit('reset', clientIp(req), 5, MINUTE);
  await resetPassword(await readBody(req, resetPasswordSchema));
  return noContent();
});
