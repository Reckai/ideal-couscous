import { IsUUID } from 'class-validator';

export class JoinRoomDTO {
  @IsUUID()
  roomId: string;
}
