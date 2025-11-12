import { ApiProperty } from '@nestjs/swagger';
import { RoomStatus } from 'generated/prisma';

export class RoomResponseDTO {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'ABC123' })
  inviteCode: string;

  @ApiProperty({ example: 'ABC123' })
  status: RoomStatus;

  @ApiProperty({ type: 'boolean' })
  isHost: boolean;

  @ApiProperty({ type: 'boolean' })
  hasGuest?: boolean | null;

  @ApiProperty({ example: '2024-10-12T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-10-12T10:30:00Z' })
  updatedAt: Date;

  @ApiProperty({
    example: '2024-10-12T10:30:00Z',
  })
  expiresAt: Date;
}
