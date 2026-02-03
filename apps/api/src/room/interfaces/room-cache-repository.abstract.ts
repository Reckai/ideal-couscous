import type { RoomStatus } from 'generated/prisma'
import type { User } from '../../matching/types/user'
import type { RoomState } from '../repositories/room-cache.repository'

export abstract class AbstractRoomCacheRepository {
  abstract initRoom(roomId: string, hostId: string, nickName: string): Promise<void>
  abstract validateRoomExistence(roomId: string): Promise<boolean>
  abstract getRoomUserCount(roomId: string): Promise<number>
  abstract getNameOfUserInRoom(roomId: string, userId: string): Promise<string | null>
  abstract isUserInRoom(roomId: string, userId: string): Promise<boolean>
  abstract markUserAsDisconnected(roomId: string, userId: string): Promise<void>
  abstract isUserDisconnected(roomId: string, userId: string): Promise<boolean>
  abstract getRoomState(roomId: string): Promise<RoomState | null>
  abstract getRoomStatus(roomId: string): Promise<RoomStatus>
  abstract updateRoomStatus(roomId: string, status: RoomStatus): Promise<void>
  abstract setUserReadiness(roomId: string, isHost: boolean, ready: boolean): Promise<void>
  abstract areBothReady(roomId: string): Promise<boolean>
  abstract getHostId(roomId: string): Promise<string>
  abstract isUserHost(roomId: string, userId: string): Promise<boolean>
  abstract saveUserSelection(roomId: string, userId: string, mediaId: string): Promise<number>
  abstract removeUserSelection(roomId: string, userId: string, mediaId: string): Promise<number>
  abstract getUserSelections(roomId: string, userId: string): Promise<string[]>
  abstract getUsersInRoom(roomId: string): Promise<User[]>
  abstract createMediaPool(roomId: string, mediaIds: string[]): Promise<void>
  abstract getMediaPool(roomId: string): Promise<string[]>
  abstract getMediaPoolSize(roomId: string): Promise<number>
  abstract removeUserFromRoom(roomId: string, userId: string): Promise<void>
  abstract addUserToRoom(roomId: string, userId: string, nickName: string): Promise<void>
  abstract getRoomIdByUserId(userId: string): Promise<string>
  abstract clearRoomIdByUserId(userId: string): Promise<void>
  abstract deleteRoomData(roomId: string, userId: string): Promise<void>
  abstract getRoomDraft(roomId: string, userId: string): Promise<string[]>
  abstract refreshRoomTTL(roomId: string): Promise<void>
  abstract roomExists(roomId: string): Promise<boolean>
}
