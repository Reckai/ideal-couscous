import type { BaseRoomData, RoomData } from '@netflix-tinder/shared'
import type { RoomStatus } from 'generated/prisma'
import type { RoomState } from '../../room/repositories'
import type { MatchFoundDTO, SwipeAction } from '../dto/swipes.dto'

export abstract class AbstractMatchingService {
  abstract createRoom(userId: string): Promise<RoomData>
  abstract addUserToRoom(roomId: string, userId: string): Promise<RoomData>
  abstract removeUserFromRoom(roomId: string, userId: string): Promise<void>
  abstract clearRoomData(roomId: string, userId: string): Promise<void>
  abstract validateRoomStatus(roomId: string): Promise<RoomState>
  abstract checkUserConnected(userId: string): Promise<boolean>
  abstract getUserRoomId(userId: string): Promise<string>
  abstract startSelections(roomId: string, userId: string): Promise<RoomData>
  abstract setUserReadiness(roomId: string, userId: string, isReady: boolean): Promise<RoomStatus>
  abstract handleUserDisconnect(roomId: string, userId: string): Promise<void>
  abstract addMediaToDraft(userId: string, roomId: string, mediaId: string): Promise<boolean>
  abstract deleteMediaFromDraft(userId: string, roomId: string, mediaId: string): Promise<boolean>
  abstract processSwipe(action: SwipeAction, userId: string, roomId: string, mediaId: string): Promise<{ isMatch: boolean, matchData?: MatchFoundDTO }>
  abstract getRoomData(roomId: string): Promise<BaseRoomData>
  abstract getSnapshotOfRoom(roomId: string, userId: string): Promise<RoomData>
  abstract getMediaPoolWithDetails(roomId: string): Promise<unknown>
}
