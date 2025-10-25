import { ApiProperty } from '@nestjs/swagger';
import { RoomStatus } from 'generated/prisma';

export class RoomUserDTO {
  @ApiProperty({ example: 'uuid-here' })
  id: string;
  @ApiProperty({ example: 'Reckai' })
  name: string;
}

export class RoomResponseDTO {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'ABC123' })
  inviteCode: string;

  @ApiProperty({ example: 'ABC123' })
  status: RoomStatus;

  @ApiProperty({ type: RoomUserDTO })
  host: RoomUserDTO;

  @ApiProperty({ type: RoomUserDTO })
  guest?: RoomUserDTO | null;

  @ApiProperty({ example: '2024-10-12T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-10-12T10:30:00Z' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Time to expiration in ms',
    example: 1800000,
  })
  timeRemaining: number;
}
