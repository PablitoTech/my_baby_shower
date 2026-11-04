import { requireUser } from '@/server/auth/session';
import { json, readQuery, route } from '@/server/http/handler';
import { listReservations } from '@/server/services/reservations.service';
import { reservationFiltersSchema } from '@/shared/schemas';

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json(await listReservations(user.id, readQuery(req, reservationFiltersSchema)));
});
