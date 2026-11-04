-- AlterTable
ALTER TABLE "gifts" DROP COLUMN "image_path";

-- CreateTable
CREATE TABLE "gift_images" (
    "id" UUID NOT NULL,
    "gift_id" UUID NOT NULL,
    "mime_type" VARCHAR(20) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" VARCHAR(200) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "gift_images_gift_id_key" ON "gift_images"("gift_id");

-- CreateIndex
CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits"("reset_at");

-- AddForeignKey
ALTER TABLE "gift_images" ADD CONSTRAINT "gift_images_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Integridad: tamaño máximo de imagen (2 MB) y tipos permitidos.
ALTER TABLE "gift_images"
  ADD CONSTRAINT "gift_images_size_check" CHECK ("size_bytes" > 0 AND "size_bytes" <= 2097152),
  ADD CONSTRAINT "gift_images_mime_check" CHECK ("mime_type" IN ('image/jpeg', 'image/png', 'image/webp'));
