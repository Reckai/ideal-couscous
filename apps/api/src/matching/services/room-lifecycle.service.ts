import {
  Injectable,
  Logger,
} from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { RoomData } from '@netflix-tinder/shared'
import { customAlphabet } from 'nanoid'
import { AbstractRoomCacheRepository } from '../../room/interfaces'
import { AbstractRoomLifecycleService } from '../interfaces'

@Injectable()
export class RoomLifecycleService extends AbstractRoomLifecycleService {
  private readonly logger = new Logger(RoomLifecycleService.name)

  private readonly generateInviteCode = customAlphabet(
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    6,
  )

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

  constructor(
    private readonly roomCache: AbstractRoomCacheRepository,
  ) {
    super()
  }

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
      throw new Error(`Error on creating room: ${error}`)
    }
  }

  async addUserToRoom(roomId: string, userId: string): Promise<RoomData> {
    const roomExist = await this.roomCache.validateRoomExistence(roomId)
    if (!roomExist) {
      throw new WsException(`Room with id ${roomId} not found`)
    }

    const status = await this.roomCache.getRoomStatus(roomId)
    if (status !== 'WAITING') {
      throw new WsException('Room has non waiting status')
    }

    const userCount = await this.roomCache.getRoomUserCount(roomId)
    if (userCount >= 2) {
      throw new WsException('Room is full')
    }

    const userNameOfUserInRoom = await this.roomCache.getNameOfUserInRoom(roomId, userId)
    const nickName = this.createUniqueNickName(userNameOfUserInRoom)

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

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    await this.roomCache.removeUserFromRoom(roomId, userId)
    const usersInRoom = await this.roomCache.getUsersInRoom(roomId)
    if (usersInRoom.length === 0) {
      await this.roomCache.deleteRoomData(roomId, userId)
    }
  }

  async clearRoomData(roomId: string, userId: string): Promise<void> {
    await this.roomCache.deleteRoomData(roomId, userId)
  }

  private createNickName(): string {
    const randomAnimal = this.animals[Math.floor(Math.random() * this.animals.length)]
    return `guest_${randomAnimal}`
  }

  private createUniqueNickName(existingNickName: string | null): string {
    const maxAttempts = 20
    for (let i = 0; i < maxAttempts; i++) {
      const candidate = this.createNickName()
      if (candidate !== existingNickName) {
        return candidate
      }
    }
    // Fallback: append random suffix to guarantee uniqueness
    return `${this.createNickName()}_${Math.random().toString(36).substring(2, 5)}`
  }
}
