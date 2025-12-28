import type { RoomWithRelations } from '../room/repositories'
import type { MatchFoundDTO } from './dto/swipes.dto'
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { BaseRoomData, RoomData, RoomStatus as SharedRoomStatus } from '@netflix-tinder/shared'
import { RoomStatus } from 'generated/prisma'
import { customAlphabet } from 'nanoid'

import { DisconnectTimerService } from 'src/room/services/disconnectTime.service'
import { PrismaService } from '../Prisma/prisma.service'
import {
  RoomCacheRepository,
  RoomRepository,
} from '../room/repositories'
import { SwipeAction } from './dto/swipes.dto'
import { MatchingCacheRepository } from './repositories/matching-cache.repository'

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name)
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomRepo: RoomRepository,
    private readonly roomCache: RoomCacheRepository,
    private readonly disconnectTimerService: DisconnectTimerService,
    private readonly matchingCache: MatchingCacheRepository,
  ) { }

  /**
   * Validates room exists and is in SWIPING state
   * @param roomId - Room UUID
   * @returns Room data
   * @throws {BadRequestException} If room not found or wrong status
   */
  async validateRoomStatus(roomId: string): Promise<RoomWithRelations> {
    const room = await this.roomRepo.findById(roomId)

    if (!room) {
      throw new BadRequestException('Room not found')
    }

    if (room.status !== RoomStatus.SWIPING) {
      throw new BadRequestException(
        `Room is not in SWIPING state. Current status: ${room.status}`,
      )
    }

    return room
  }

  /**
   * Validates user is a member of the room (host or guest)
   * @param room - Room data
   * @param userId - User UUID
   * @throws {BadRequestException} If user is not a member
   */
  validateUserMembership(room: RoomWithRelations, userId: string): void {
    const isHost = room.hostId === userId
    const isGuest = room.guestId !== null && room.guestId === userId

    if (!isHost && !isGuest) {
      throw new BadRequestException('You are not a member of this room')
    }
  }

  private checkMatch(hostSwipe: SwipeAction, guestSwipe: SwipeAction) {
    return hostSwipe === SwipeAction.LIKE && guestSwipe === SwipeAction.LIKE
  }

  private async saveMatchToDatabase(
    roomId: string,
    mediaId: string,
  ): Promise<void> {
    await this.roomRepo.createMatch(roomId, mediaId)
    this.logger.log(`Match saved to database for room ${roomId}`)
  }

  private async updateRoomToMatched(roomId: string): Promise<void> {
    await this.roomRepo.updateStatus(roomId, RoomStatus.MATCHED)
    await this.roomCache.updateRoomStatus(roomId, RoomStatus.MATCHED)
    this.logger.log(`Room ${roomId} status updated to MATCHED`)
  }

  private readonly generateInviteCode = customAlphabet(
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    6,
  )

  async createRoom(userId: string): Promise<RoomData> {
    const roomId = this.generateInviteCode()
    const nickName = this.createNickName()
    try {
      await this.roomCache.initRoom(roomId, userId, nickName)
      const users = await this.roomCache.getUsersInRoom(roomId)

      return {
        inviteCode: roomId,
        usersCount: users.length,
        users: users.map((user) => ({ ...user, isHost: true })),
        status: 'WAITING',
      }
    } catch (error) {
      throw new Error(`Error on creating room:${error}`)
    }
  }

  async removeUserFromRoom(roomId: string, userId: string) {
    await this.roomCache.removeUserFromRoom(roomId, userId)
    const usersInRoom = await this.roomCache.getUsersInRoom(roomId)
    if (usersInRoom.length === 0) {
      await this.roomCache.deleteRoomData(roomId)
    }
  }

  async addUserToRoom(roomId: string, userId: string): Promise<RoomData> {
    const roomExist = await this.roomCache.validateRoomExistence(roomId)

    if (!roomExist) {
      throw new NotFoundException(`Room with id ${roomId} not found`)
    }

    const status = await this.roomCache.getRoomStatus(roomId)

    if (status !== 'WAITING') {
      throw new BadRequestException('Room has non waiting status')
    }

    const userCount = await this.roomCache.getRoomUserCount(roomId)
    if (userCount >= 2) {
      throw new BadRequestException(`Room is full`)
    }

    const userNameOfUserInRoom = await this.roomCache.getNameOfUserInRoom(roomId, userId)

    const nickName = this.compareAndRecreateNickName(userNameOfUserInRoom, this.createNickName())
    await this.roomCache.addUserToRoom(roomId, userId, nickName)
    const users = await this.roomCache.getUsersInRoom(roomId)
    const hostId = await this.roomCache.getHostId(roomId)

    return {
      users: users.map((user) => ({ ...user, isHost: user.userId === hostId })),
      usersCount: users.length,
      inviteCode: roomId,
      status: status as 'WAITING',
    }
  }

  async getRoomData(roomId: string): Promise<BaseRoomData> {
    const users = await this.roomCache.getUsersInRoom(roomId)
    const hostId = await this.roomCache.getHostId(roomId)
    const status = await this.roomCache.getRoomStatus(roomId)

    return {
      users: users.map((user) => ({
        ...user,
        isHost: user.userId === hostId,
      })),
      usersCount: users.length,
      inviteCode: roomId,
      status: status as SharedRoomStatus,
    }
  }

  async checkUserConnected(userId: string) {
    const roomId = await this.roomCache.getRoomIdByUserId(userId)
    if
    (!roomId)
      return false
    const socketId = `${roomId}_${userId}`
    await this.disconnectTimerService.clearTimer(socketId)
    return true
  }

  async getUserRoomId(userId: string) {
    return await this.roomCache.getRoomIdByUserId(userId)
  }

  private readonly animals = [
    'Panda',
    'Fox',
    'Wolf',
    'Bear',
    'Tiger',
    'Lion',
    'Eagle',
    'Owl',
    'Dolphin',
    'Shark',
    'Dragon',
    'Phoenix',
    'Unicorn',
    'Giraffe',
    'Koala',
    'Penguin',
    'Rabbit',
    'Cat',
    'Dog',
    'Hawk',
  ]

  private createNickName(): string {
    const randomAnimal = this.animals[Math.floor(Math.random() * this.animals.length)]
    return `guest_${randomAnimal}`
  }

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
      const result = await this.roomCache.saveUserSelection(roomId, mediaId)

      return result === 1
    } catch (e) {
      if (e.message === 'Draft limit reached') {
        throw new WsException('Deck limit reached (max 50)')
      }
      throw e
    }
  }

  async processSwipe(
    action: SwipeAction,
    userId: string,
    roomId: string,
    mediaId: string,
  ): Promise<{ isMatch: boolean, matchData?: MatchFoundDTO }> {
    const room = await this.validateRoomStatus(roomId)
    await this.validateRoomStatus(roomId)
    if (!room) {
      throw new NotFoundException('Room not found')
    }
    this.validateUserMembership(room, userId)
    await this.matchingCache.saveSwipe(roomId, userId, mediaId, action)

    this.logger.log(
      `User ${userId} swiped ${action} on media ${mediaId} in room ${roomId}`,
    )

    const { hostSwipe, guestSwipe }
      = await this.matchingCache.getSwipesForMedia(
        room.id,
        mediaId,
        room.hostId,
        room.guestId,
      )

    if (!(hostSwipe && guestSwipe)) {
      return { isMatch: false }
    }

    const isMatch = this.checkMatch(hostSwipe, guestSwipe)
    if (!isMatch) {
      return { isMatch: false }
    }
    this.logger.log(`MATCH found in room ${roomId} for media ${mediaId}`)
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    })

    if (!media) {
      throw new BadRequestException('Media not found')
    }

    this.saveMatchToDatabase(room.id, mediaId).catch((err) => {
      this.logger.error(`Failed to save match to database: ${err.message}`)
    })

    this.updateRoomToMatched(roomId).catch((err) => {
      this.logger.error(`Failed to update room status: ${err.message}`)
    })

    const matchData: MatchFoundDTO = {
      mediaId: media.id,
      mediaTitle: media.title,
      posterPath: media.posterPath,
      matchedAt: new Date(),
    }

    return { isMatch: true, matchData }
  }

  async handleUserDisconnect(roomId: string, userId: string): Promise<void> {
    this.logger.log(`User ${userId} disconnected from room ${roomId}`)

    // Update room status to CANCELLED
    await this.roomRepo.updateStatus(roomId, RoomStatus.CANCELLED)
    await this.roomCache.updateRoomStatus(roomId, RoomStatus.CANCELLED)

    // Note: We keep swipes for potential reconnection/debugging
    // They will expire with TTL anyway
  }

  async getMediaPoolWithDetails(roomId: string) {
    const mediaIds = await this.roomCache.getMediaPool(roomId)

    // Достаем детали из PostgreSQL
    const media = await this.prisma.media.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, title: true, posterPath: true },
    })

    // Возвращаем в том же порядке что в pool
    return mediaIds.map((id) => media.find((m) => m.id === id))
  }

  async getSnapshotOfRoom(roomId: string): Promise<RoomData> {
    const status = await this.roomCache.getRoomStatus(roomId)
    const basicData = await this.getRoomData(roomId)

    switch (status) {
      case 'WAITING':
        return {
          ...basicData,
          status: 'WAITING',
        }
      case 'SELECTING': {
        const selectedAnime = await this.roomCache.getRoomDraft(roomId)
        return {
          ...basicData,
          selectedAnime,
          status: 'SELECTING',
        }
      }
      case 'READY':
      {
        const selectedAnime = await this.roomCache.getRoomDraft(roomId)
        return {
          ...basicData,
          selectedAnime,
          status: 'READY',
        }
      }
      case 'MATCHED':
        return {
          ...basicData,
          status: 'MATCHED',
          matchId: '123',
        }
      default:
        throw new NotFoundException('Room not found')
    }
  }

  private compareAndRecreateNickName(nickNameInRoom: string, nickName: string) {
    if (nickNameInRoom !== nickName) {
      return nickName
    }
    const newNickName = this.createNickName()
    return this.compareAndRecreateNickName(nickNameInRoom, newNickName)
  }

  async startSelections(roomId: string, userId: string): Promise<RoomData> {
    const [hostId, status, usersCount] = await Promise.all([
      this.roomCache.getHostId(roomId),
      this.roomCache.getRoomStatus(roomId),
      this.roomCache.getRoomUserCount(roomId),
    ])
    if (hostId !== userId || status !== 'WAITING' || usersCount < 2) {
      throw new BadRequestException('You can`t start selection in this room')
    }

    await this.roomCache.updateRoomStatus(roomId, 'SELECTING')
    return this.getSnapshotOfRoom(roomId)
  }
}
