import { Injectable, Logger } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { RoomCacheRepository } from '../../room/repositories'

@Injectable()
export class SelectionService {
  private readonly logger = new Logger(SelectionService.name)

  constructor(
    private readonly roomCache: RoomCacheRepository,
  ) {}

  async addMediaToDraft(
    userId: string,
    roomId: string,
    mediaId: string,
  ): Promise<boolean> {
    const isMember = await this.roomCache.isUserInRoom(roomId, userId)
    if (!isMember) {
      throw new WsException('User is not member of the room')
    }

    const roomStatus = await this.roomCache.getRoomStatus(roomId)
    if (roomStatus !== 'WAITING' && roomStatus !== 'SELECTING') {
      throw new WsException('Cannot add items in current room state')
    }

    try {
      const result = await this.roomCache.saveUserSelection(roomId, userId, mediaId)
      await this.roomCache.refreshRoomTTL(roomId)
      return result === 1
    } catch (e) {
      if (e.message === 'Draft limit reached') {
        throw new WsException('Deck limit reached (max 50)')
      }
      throw e
    }
  }

  async deleteMediaFromDraft(
    userId: string,
    roomId: string,
    mediaId: string,
  ): Promise<boolean> {
    const isMember = await this.roomCache.isUserInRoom(roomId, userId)
    if (!isMember) {
      throw new WsException('User is not member of the room')
    }

    const roomStatus = await this.roomCache.getRoomStatus(roomId)
    if (roomStatus !== 'WAITING' && roomStatus !== 'SELECTING') {
      throw new WsException('Cannot remove items in current room state')
    }

    const result = await this.roomCache.removeUserSelection(roomId, userId, mediaId)
    await this.roomCache.refreshRoomTTL(roomId)
    return result === 1
  }
}
