import type { Media, Prisma } from 'generated/prisma'
import type { MediaEntityDTO, MediaQueryDto } from '../dto/media.dto'
import type { CursorPaginatedResult } from '../repositories/media.repository'

export abstract class AbstractMediaRepository {
  abstract findAllWithCursor(params: MediaQueryDto): Promise<CursorPaginatedResult<Media>>
  abstract findById(mediaId: string): Promise<Media | null>
  abstract create(data: Prisma.MediaCreateInput): Promise<Media>
  abstract findByTitle(title: string): Promise<Media>
  abstract findManyByIds(ids: string[]): Promise<Media[]>
  abstract bulkUpsert(animes: MediaEntityDTO[]): Promise<number>
}
