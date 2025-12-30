import type { MediaEntityDTO, MediaQueryDto } from '../dto/media.dto'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { Media, Prisma } from 'generated/prisma'
import { PrismaService } from '../../Prisma/prisma.service'

import { DEFAULT_LIMIT, MAX_LIMIT, MIN_LIMIT } from '../consts'

interface DecodedCursor {
  createdAt: Date
  id: string
}
export interface CursorPaginatedResult<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
  count: number
}

@Injectable()
export class MediaRepository {
  private readonly logger = new Logger(MediaRepository.name)

  constructor(private readonly prisma: PrismaService) { }

  async findAllWithCursor(
    params: MediaQueryDto,
  ): Promise<CursorPaginatedResult<Media>> {
    const { limit = DEFAULT_LIMIT, cursor, search } = params

    const validLimit = Math.min(Math.max(MIN_LIMIT, limit), MAX_LIMIT)

    let decodedCursor: DecodedCursor | null = null
    if (cursor) {
      decodedCursor = this.decodeCursor(cursor)
    }

    const where: Prisma.MediaWhereInput = {}

    if (search && search.trim().length > 0) {
      where.title = {
        contains: search.trim(),
        mode: 'insensitive',
      }
    }

    if (decodedCursor) {
      where.OR = [
        { createdAt: { lt: decodedCursor.createdAt } },

        {
          createdAt: decodedCursor.createdAt,
          id: { gt: decodedCursor.id },
        },
      ]
    }

    try {
      const data = await this.prisma.media.findMany({
        where,
        take: validLimit + 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      })

      const hasMore = data.length > validLimit

      const results = hasMore ? data.slice(0, validLimit) : data

      let nextCursor: string | null = null
      if (hasMore && results.length > 0) {
        const lastItem = results[results.length - 1]
        nextCursor = this.encodeCursor({
          createdAt: lastItem.createdAt,
          id: lastItem.id,
        })
      }

      this.logger.debug(
        `Found ${results.length} media (hasMore: ${hasMore}, search: ${search || 'none'})`,
      )

      return {
        data: results,
        nextCursor,
        hasMore,
        count: results.length,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch media: ${error.message}`, error.stack)
      throw error
    }
  }

  private encodeCursor(cursor: DecodedCursor): string {
    const payload = JSON.stringify({
      createdAt: cursor.createdAt.toISOString(),
      id: cursor.id,
    })
    return Buffer.from(payload).toString('base64url')
  }

  private decodeCursor(cursor: string): DecodedCursor {
    try {
      const payload = Buffer.from(cursor, 'base64url').toString('utf-8')
      const decode = JSON.parse(payload)
      return {
        createdAt: new Date(decode.createdAt),
        id: decode.id,
      }
    } catch (error) {
      throw new BadRequestException('Invalid cursor format', error)
    }
  }

  async findById(mediaId: string): Promise<Media | null> {
    this.logger.debug(`Trying to find media by id ${mediaId}`)

    try {
      return await this.prisma.media.findUnique({
        where: {
          id: mediaId,
        },
      })
    } catch (error) {
      this.logger.error(`Filed to find media by id: ${error.message}`)
      throw error
    }
  }

  async create(data: Prisma.MediaCreateInput): Promise<Media> {
    this.logger.debug(`Creating media: ${data.title}`)

    try {
      return await this.prisma.media.create({
        data,
      })
    } catch (error) {
      this.logger.error(
        `Failed to create media: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  async findByTitle(title: string): Promise<Media> {
    try {
      return await this.prisma.media.findFirst({
        where: {
          title,
        },
      })
    } catch (error) {
      this.logger.error(`Filed to find media by title: ${error.message}`)
      throw error
    }
  }

  async findManyByIds(ids: string[]): Promise<Media[]> {
    try {
      return await this.prisma.media.findMany({
        where: {
          id: {
            in: ids,
          },
        },
      })
    } catch (error) {
      this.logger.error(`Filed to find medias by ids: ${error.message}`)
      throw error
    }
  }

  async bulkUpsert(animes: MediaEntityDTO[]) {
    if (animes.length === 0)
      return

    const values = animes.map((anime) =>
      Prisma.sql`(
        gen_random_uuid(), 
        ${anime.tmdbId}, 
        ${anime.title}, 
        ${anime.posterPath}, 
        ${anime.TMDBLink}, 
        NOW(), 
        NOW()
      )`,
    )
    try {
      const result = await this.prisma.$executeRaw`
    INSERT INTO "media" ("id", "tmdb_id", "title", "poster_path", "tmdb_link", "created_at", "updated_at")
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("tmdb_id")
    DO UPDATE SET
    "title" = EXCLUDED."title",
    "poster_path" = EXCLUDED."poster_path",
    "updated_at" = NOW()
    `
      return result
    } catch (error) {
      throw new Error(`Bulk upsert failed: ${error.message}`)
    }
  }
}
