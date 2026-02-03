import type { RoomState } from '../../room/repositories'
import {
  Injectable,
  Logger,
} from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { RoomStatus } from 'generated/prisma'
import { AbstractDisconnectTimerService, AbstractRoomCacheRepository } from '../../room/interfaces'
import { AbstractRoomStateService } from '../interfaces'

@Injectable()
export class RoomStateService extends AbstractRoomStateService {
  private readonly logger = new Logger(RoomStateService.name)

  constructor(
    private readonly roomCache: AbstractRoomCacheRepository,
    private readonly disconnectTimerService: AbstractDisconnectTimerService,
  ) {
    super()
  }

  async validateRoomStatus(roomId: string): Promise<RoomState> {
    const room = await this.roomCache.getRoomState(roomId)
    if (!room) {
      throw new WsException('Room not found')
    }

    if (room.status !== RoomStatus.SWIPING) {
      throw new WsException(
        `Room is not in SWIPING state. Current status: ${room.status}`,
      )
    }

    return room
  }

  async checkUserConnected(userId: string): Promise<boolean> {
    const roomId = await this.roomCache.getRoomIdByUserId(userId)
    if (!roomId)
      return false

    const socketId = `${roomId}_${userId}`
    await this.disconnectTimerService.clearTimer(socketId)
    return true
  }

  async getUserRoomId(userId: string): Promise<string> {
    return await this.roomCache.getRoomIdByUserId(userId)
  }

  async startSelections(roomId: string, userId: string): Promise<void> {
    const [hostId, status, usersCount] = await Promise.all([
      this.roomCache.getHostId(roomId),
      this.roomCache.getRoomStatus(roomId),
      this.roomCache.getRoomUserCount(roomId),
    ])

    if (hostId !== userId || status !== 'WAITING' || usersCount < 2) {
      throw new WsException('You can\'t start selection in this room')
    }

    await this.roomCache.updateRoomStatus(roomId, 'SELECTING')
  }

  async setUserReadiness(roomId: string, userId: string, isReady: boolean): Promise<RoomStatus> {
    const isMember = await this.roomCache.isUserInRoom(roomId, userId)
    if (!isMember) {
      throw new WsException('User is not a member of this room')
    }

    const status = await this.roomCache.getRoomStatus(roomId)
    if (status !== 'SELECTING') {
      throw new WsException('Cannot set readiness - room is not in SELECTING state')
    }

    const isHost = await this.roomCache.isUserHost(roomId, userId)
    await this.roomCache.setUserReadiness(roomId, isHost, isReady)

    if (isReady) {
      const bothReady = await this.roomCache.areBothReady(roomId)
      if (bothReady) {
        const users = await this.roomCache.getUsersInRoom(roomId)
        const allSelections: string[] = []

        for (const user of users) {
          const selections = await this.roomCache.getUserSelections(roomId, user.userId)
          allSelections.push(...selections)
        }

        const shuffled = this.shuffleArray([...new Set(allSelections)])
        await this.roomCache.createMediaPool(roomId, shuffled)
        await this.roomCache.updateRoomStatus(roomId, 'SWIPING')

        this.logger.log(`Room ${roomId} transitioned to SWIPING state`)
        return 'SWIPING'
      }
    }

    return 'SELECTING'
  }

  async handleUserDisconnect(roomId: string, userId: string): Promise<void> {
    this.logger.log(`User ${userId} disconnected from room ${roomId}`)
    await this.roomCache.updateRoomStatus(roomId, RoomStatus.CANCELLED)
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }
}
