-- La reserva de invitados ya no pide correo: solo nombre completo, cantidad y mensaje opcional.
ALTER TABLE "gift_reservations" DROP COLUMN IF EXISTS "guest_email";
