import type { Prisma, Room, RoomStatus } from 'generated/prisma'
import type { RoomWithRelations } from '../repositories/room.repository'

export abstract class AbstractRoomRepository {
  abstract create(hostId: string, inviteCode: string, expiresAt: Date, preferences?: Prisma.JsonValue): Promise<RoomWithRelations>
  abstract findById(roomId: string): Promise<RoomWithRelations | null>
  abstract findByInviteCode(inviteCode: string): Promise<RoomWithRelations | null>
  abstract existsByInviteCode(inviteCode: string): Promise<boolean>
  abstract addGuest(roomId: string, guestId: string): Promise<RoomWithRelations>
  abstract updateStatus(roomId: string, status: RoomStatus): Promise<Room>
  abstract createMatch(roomId: string, mediaId: string): Promise<RoomWithRelations>
  abstract delete(roomId: string): Promise<void>
}
