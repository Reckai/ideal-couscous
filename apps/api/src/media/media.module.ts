import { HttpModule } from '@nestjs/axios'
import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { TmdbAdapter } from './adapters/tmdbAdapter/tmdb.adapter'
import { MediaController } from './media.controller'
import { AnimeProcessor } from './media.processor'
import { AnimeScheduler } from './media.scheduler'
import { MediaService } from './media.service'
import { MediaRepository } from './repositories/media.repository'

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({
      name: 'anime-sync-queue',
    }),

  ],
  providers: [MediaService, MediaRepository, TmdbAdapter, AnimeProcessor, AnimeScheduler],
  controllers: [MediaController],
  exports: [MediaService, MediaRepository, TmdbAdapter, BullModule],
})
export class MediaModule {}
