-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PARENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('AVAILABLE', 'PARTIALLY_RESERVED', 'RESERVED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'DELIVERED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PARENT',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(3),
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "user_agent" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_showers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "baby_name" VARCHAR(60) NOT NULL,
    "father_name" VARCHAR(100) NOT NULL,
    "mother_name" VARCHAR(100) NOT NULL,
    "event_date" TIMESTAMPTZ(3) NOT NULL,
    "description" VARCHAR(1000),
    "public_slug" VARCHAR(80),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "baby_showers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifts" (
    "id" UUID NOT NULL,
    "public_id" VARCHAR(24) NOT NULL,
    "baby_shower_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "quantity_required" INTEGER NOT NULL,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "image_path" VARCHAR(255),
    "status" "GiftStatus" NOT NULL DEFAULT 'AVAILABLE',
    "record_status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_reservations" (
    "id" UUID NOT NULL,
    "confirmation_code" VARCHAR(16) NOT NULL,
    "gift_id" UUID NOT NULL,
    "guest_name" VARCHAR(120) NOT NULL,
    "guest_email" VARCHAR(254),
    "quantity" INTEGER NOT NULL,
    "message" VARCHAR(500),
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "confirmed_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "delivered_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "gift_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "baby_showers_user_id_key" ON "baby_showers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "baby_showers_public_slug_key" ON "baby_showers"("public_slug");

-- CreateIndex
CREATE INDEX "baby_showers_is_published_idx" ON "baby_showers"("is_published");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "gifts_public_id_key" ON "gifts"("public_id");

-- CreateIndex
CREATE INDEX "gifts_baby_shower_id_record_status_idx" ON "gifts"("baby_shower_id", "record_status");

-- CreateIndex
CREATE INDEX "gifts_category_id_idx" ON "gifts"("category_id");

-- CreateIndex
CREATE INDEX "gifts_status_idx" ON "gifts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "gift_reservations_confirmation_code_key" ON "gift_reservations"("confirmation_code");

-- CreateIndex
CREATE INDEX "gift_reservations_gift_id_status_idx" ON "gift_reservations"("gift_id", "status");

-- CreateIndex
CREATE INDEX "gift_reservations_status_idx" ON "gift_reservations"("status");

-- CreateIndex
CREATE INDEX "gift_reservations_created_at_idx" ON "gift_reservations"("created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_showers" ADD CONSTRAINT "baby_showers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_baby_shower_id_fkey" FOREIGN KEY ("baby_shower_id") REFERENCES "baby_showers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_reservations" ADD CONSTRAINT "gift_reservations_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Restricciones de integridad adicionales (no expresables en schema.prisma)
-- ---------------------------------------------------------------------------

-- Cantidades de regalos: requerida >= 1 y reservada entre 0 y la requerida.
ALTER TABLE "gifts"
  ADD CONSTRAINT "gifts_quantity_required_check" CHECK ("quantity_required" BETWEEN 1 AND 999),
  ADD CONSTRAINT "gifts_quantity_reserved_check" CHECK ("quantity_reserved" >= 0 AND "quantity_reserved" <= "quantity_required");

-- Reservas: cantidad positiva.
ALTER TABLE "gift_reservations"
  ADD CONSTRAINT "gift_reservations_quantity_check" CHECK ("quantity" >= 1);

-- Identidad normalizada en minúsculas.
ALTER TABLE "users"
  ADD CONSTRAINT "users_email_lowercase_check" CHECK ("email" = lower("email")),
  ADD CONSTRAINT "users_username_lowercase_check" CHECK ("username" = lower("username")),
  ADD CONSTRAINT "users_failed_login_attempts_check" CHECK ("failed_login_attempts" >= 0);

-- Un Baby Shower publicado debe tener enlace público.
ALTER TABLE "baby_showers"
  ADD CONSTRAINT "baby_showers_published_slug_check" CHECK (NOT "is_published" OR "public_slug" IS NOT NULL);
