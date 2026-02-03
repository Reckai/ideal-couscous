import type { RoomStatus } from 'generated/prisma'
import type { RoomState } from '../../room/repositories'

export abstract class AbstractRoomStateService {
  abstract validateRoomStatus(roomId: string): Promise<RoomState>
  abstract checkUserConnected(userId: string): Promise<boolean>
  abstract getUserRoomId(userId: string): Promise<string>
  abstract startSelections(roomId: string, userId: string): Promise<void>
  abstract setUserReadiness(roomId: string, userId: string, isReady: boolean): Promise<RoomStatus>
  abstract handleUserDisconnect(roomId: string, userId: string): Promise<void>
}
