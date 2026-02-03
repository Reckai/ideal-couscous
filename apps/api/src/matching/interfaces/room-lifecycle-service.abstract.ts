import type { RoomData } from '@netflix-tinder/shared'

export abstract class AbstractRoomLifecycleService {
  abstract createRoom(userId: string): Promise<RoomData>
  abstract addUserToRoom(roomId: string, userId: string): Promise<RoomData>
  abstract removeUserFromRoom(roomId: string, userId: string): Promise<void>
  abstract clearRoomData(roomId: string, userId: string): Promise<void>
}
