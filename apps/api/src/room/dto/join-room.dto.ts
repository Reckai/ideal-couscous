import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length, Matches } from 'class-validator'

export class JoinRoomDTO {
  @ApiProperty({
    description: 'Invite code комнаты (6 символов: A-Z, 0-9)',
    example: 'ABC123',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6, { message: 'Invite code must be at least 6 characters ' })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Invite code может содержать только заглавные буквы и цифры',
  })
  inviteCode: string
}
