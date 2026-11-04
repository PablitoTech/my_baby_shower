import { requireUser } from '@/server/auth/session';
import { json, readBody, route } from '@/server/http/handler';
import { updateReservationStatus } from '@/server/services/reservations.service';
import { updateReservationStatusSchema } from '@/shared/schemas';
import { uuidParam } from '../../../gifts/_id';

export const PATCH = route<{ id: string }>(async (req, { id }) => {
  const user = await requireUser(req);
  const input = await readBody(req, updateReservationStatusSchema);
  return json(await updateReservationStatus(user.id, uuidParam(id, 'RESERVATION_NOT_FOUND'), input));
});
