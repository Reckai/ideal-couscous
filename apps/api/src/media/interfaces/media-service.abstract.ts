import type { MediaDto, MediaListResponseDto, MediaQueryDto } from '../dto/media.dto'

export abstract class AbstractMediaService {
  abstract findAll(query: MediaQueryDto): Promise<MediaListResponseDto>
  abstract findById(id: string): Promise<MediaDto>
  abstract findByIds(ids: string[]): Promise<MediaDto[]>
}
