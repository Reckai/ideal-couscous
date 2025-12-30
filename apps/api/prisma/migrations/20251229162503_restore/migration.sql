-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'SELECTING', 'READY', 'SWIPING', 'MATCHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'MATCHED', 'REJECTED');

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "poster_path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tmdb_id" TEXT,
    "tmdb_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
    "host_id" TEXT NOT NULL,
    "guest_id" TEXT,
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_matches" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,
    "matched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_created_at_id_idx" ON "media"("created_at" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_invite_code_key" ON "rooms"("invite_code");

-- CreateIndex
CREATE INDEX "rooms_status_expires_at_idx" ON "rooms"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "room_matches_room_id_key" ON "room_matches"("room_id");

-- CreateIndex
CREATE INDEX "room_matches_media_id_idx" ON "room_matches"("media_id");

-- CreateIndex
CREATE INDEX "room_matches_matched_at_idx" ON "room_matches"("matched_at");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_matches" ADD CONSTRAINT "room_matches_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_matches" ADD CONSTRAINT "room_matches_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
