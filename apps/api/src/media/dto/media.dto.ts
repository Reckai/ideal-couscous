import type { Media } from 'generated/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator'

export class GetAnimeBatchDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[]
}

export class MediaQueryDto {
  @ApiProperty({ description: 'Number of items per page', required: false, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20

  @ApiProperty({ description: 'Base64-encoded cursor for pagination', required: false })
  @IsOptional()
  @IsString()
  cursor?: string

  @ApiProperty({ description: 'Search by title', required: false })
  @IsOptional()
  @IsString()
  search?: string
}

export class MediaDto {
  id: string
  title: string
  posterPath: string
  tmdbId?: string
  TMDBLink?: string
  createdAt: Date

  static fromPrisma(media: Media): MediaDto {
    return {
      id: media.id,
      title: media.title,
      posterPath: media.posterPath,
      tmdbId: media.tmdbId,
      TMDBLink: media.TMDBLink,
      createdAt: media.createdAt,
    }
  }
}

export class CursorPaginationDto {
  nextCursor: string | null
  hasMore: boolean
  count: number
}

export class MediaListResponseDto {
  data: MediaDto[]
  pagination: CursorPaginationDto
}

export class MediaEntityDTO {
  posterPath: string
  title: string
  tmdbId: string
  TMDBLink: string
}
