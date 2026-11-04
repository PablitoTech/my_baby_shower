-- Simplifica el ciclo de vida de las reservas a dos estados:
--   CONFIRMED (el invitado confirma al reservar) → DELIVERED (los padres lo marcan como entregado).

-- 1) Datos existentes
--    PENDING  → CONFIRMED (el invitado ya había confirmado desde la página pública).
--    CANCELLED: ya habían liberado sus unidades del regalo, así que se eliminan.
UPDATE "gift_reservations" SET "status" = 'CONFIRMED' WHERE "status" = 'PENDING';
DELETE FROM "gift_reservations" WHERE "status" = 'CANCELLED';
UPDATE "gift_reservations" SET "confirmed_at" = "created_at" WHERE "confirmed_at" IS NULL;

-- 2) Nuevo enum
ALTER TYPE "ReservationStatus" RENAME TO "ReservationStatus_old";
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'DELIVERED');
ALTER TABLE "gift_reservations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "gift_reservations"
  ALTER COLUMN "status" TYPE "ReservationStatus" USING ("status"::text::"ReservationStatus");
ALTER TABLE "gift_reservations" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
DROP TYPE "ReservationStatus_old";

-- 3) Columnas
ALTER TABLE "gift_reservations" DROP COLUMN "cancelled_at";
ALTER TABLE "gift_reservations"
  ALTER COLUMN "confirmed_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "confirmed_at" SET NOT NULL;

-- 4) Integridad: una reserva entregada debe tener fecha de entrega.
ALTER TABLE "gift_reservations"
  ADD CONSTRAINT "gift_reservations_delivered_at_check" CHECK ("status" <> 'DELIVERED' OR "delivered_at" IS NOT NULL);
