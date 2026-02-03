import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

export enum SwipeAction {
  LIKE = 'LIKE',
  SKIP = 'SKIP',
}

export class MatchFoundDTO {
  @IsUUID()
  mediaId: string

  @IsString()
  mediaTitle: string

  @IsOptional()
  @IsString()
  posterPath: string | null

  @IsDateString()
  matchedAt: Date
}
