import { Module } from '@nestjs/common'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'
import { MediaRepository } from './repositories/media.repository'

@Module({
  providers: [MediaService, MediaRepository],
  controllers: [MediaController],
  exports: [MediaService, MediaRepository],
})
export class MediaModule {}
