import type { MediaListResponseDto, MediaQueryDto } from './dto/media.dto'
import { Injectable, NotFoundException } from '@nestjs/common'
import { MediaDto } from './dto/media.dto'
import { MediaRepository } from './repositories/media.repository'

@Injectable()
export class MediaService {
  constructor(private readonly mediaRepository: MediaRepository) {}

  async findAll(query: MediaQueryDto): Promise<MediaListResponseDto> {
    const result = await this.mediaRepository.findAllWithCursor(query)
    return {
      data: result.data.map(MediaDto.fromPrisma),
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        count: result.count,
      },
    }
  }

  async findById(id: string): Promise<MediaDto> {
    const media = await this.mediaRepository.findById(id)
    if (!media) {
      throw new NotFoundException(`Media with ID "${id}" not found`)
    }
    return MediaDto.fromPrisma(media)
  }
}
