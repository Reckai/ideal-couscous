import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { SwipeAction } from './swipes.dto'

export class RoomIdDto {
  @IsString()
  @IsNotEmpty()
  roomId: string
}

export class MediaIdDto {
  @IsString()
  @IsNotEmpty()
  mediaId: string
}

export class SwipeDto {
  @IsString()
  @IsNotEmpty()
  mediaId: string

  @IsEnum(SwipeAction)
  action: SwipeAction
}

export class SetReadyDto {
  @IsBoolean()
  isReady: boolean
}
