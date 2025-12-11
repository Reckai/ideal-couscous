import type { Media } from 'generated/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class MediaResponseDTO {
  @ApiProperty({ description: 'uuid-here' })
  mediaId: string

  @ApiProperty({
    description: 'relation path to media',
    example: 'nrM2xFUfKJJEmZzd5d7kohT2G0C.jpg',
  })
  posterPath: string

  @ApiProperty({ description: 'title of media' })
  title: string

  @ApiProperty({ description: 'link  to tmdb where user can find more info' })
  tmdbLink: string
}

export class CreateMediaDTO {
  @ApiProperty({
    description: 'relation path to media',
    example: 'nrM2xFUfKJJEmZzd5d7kohT2G0C.jpg',
  })
  @IsString()
  posterPath: string

  @ApiProperty({
    description: 'Name of media',
    example: 'Attack on titan',
  })
  @IsString()
  title: string

  @ApiProperty({
    description: 'Name of media',
    example: 'Attack on titan',
  })
  @IsString()
  @IsOptional()
  tmdbId: string | null

  @ApiProperty({
    description: 'Link to medio on tmdb',
    example: 'https://www.themoviedb.org/tv/225171-pluribus',
  })
  @IsString()
  @IsOptional()
  TMDBLink: string
}

export class MediaQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20 // Default: 20

  @IsOptional()
  @IsString()
  cursor?: string // Base64-encoded cursor

  @IsOptional()
  @IsString()
  search?: string // Поиск по названию
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

/**
 * Пагинация для cursor-based
 */
export class CursorPaginationDto {
  nextCursor: string | null
  hasMore: boolean
  count: number
}

/**
 * Ответ с пагинацией
 */
export class MediaListResponseDto {
  data: MediaDto[]
  pagination: CursorPaginationDto
}
