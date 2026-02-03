import type { BaseRoomData, RoomData } from '@netflix-tinder/shared'

export abstract class AbstractRoomSerializerService {
  abstract getRoomData(roomId: string): Promise<BaseRoomData>
  abstract getSnapshotOfRoom(roomId: string, userId: string): Promise<RoomData>
  abstract getMediaPoolWithDetails(roomId: string): Promise<unknown>
}
