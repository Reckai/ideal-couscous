/*
  Warnings:

  - A unique constraint covering the columns `[tmdb_id]` on the table `media` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "media_tmdb_id_key" ON "media"("tmdb_id");
