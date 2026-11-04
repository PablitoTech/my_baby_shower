-- Restaura la cancelación de reservas por parte de los padres:
--   CONFIRMED → DELIVERED | CANCELLED  (ambos finales; cancelar libera las unidades del regalo).

ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "gift_reservations" ADD COLUMN "cancelled_at" TIMESTAMPTZ(3);

-- Integridad: una reserva cancelada debe tener fecha de cancelación.
-- (Se compara como texto porque el nuevo valor del enum no puede usarse en la misma transacción.)
ALTER TABLE "gift_reservations"
  ADD CONSTRAINT "gift_reservations_cancelled_at_check" CHECK ("status"::text <> 'CANCELLED' OR "cancelled_at" IS NOT NULL);
