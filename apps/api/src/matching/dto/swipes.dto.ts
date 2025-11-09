import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export enum SwipeAction {
  LIKE = 'LIKE',
  SKIP = 'SKIP',
}

export class SwipeDTO {
  @IsEnum(SwipeAction)
  action: SwipeAction;

  @IsUUID()
  mediaId: string;
}
// мне нада сделать дто свайпы, респонс

export class SwipeResponseDTO {
  @IsUUID()
  roomId: string;

  @IsUUID()
  mediaId: string;

  @IsEnum(SwipeAction)
  action: SwipeAction;
}

export class MatchFoundDTO {
  @IsUUID()
  mediaId: string;

  @IsString()
  mediaTitle: string;

  @IsOptional()
  @IsString()
  posterPath: string | null;

  @IsDateString()
  matchedAt: Date;
}
export class UserStatusDto {
  userId: string;
  status: 'online' | 'offline';
}

export class ErrorDto {
  message: string;
  code?: string;
}
