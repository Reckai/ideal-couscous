import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { BaseRoomData, RoomData, RoomStatus as SharedRoomStatus } from '@netflix-tinder/shared'
import { customAlphabet } from 'nanoid'
import { RoomCacheRepository } from '../../room/repositories'

@Injectable()
export class RoomLifecycleService {
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
    private readonly roomCache: RoomCacheRepository,
  ) {}

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
      throw new NotFoundException(`Room with id ${roomId} not found`)
    }

    const status = await this.roomCache.getRoomStatus(roomId)
    if (status !== 'WAITING') {
      throw new BadRequestException('Room has non waiting status')
    }

    const userCount = await this.roomCache.getRoomUserCount(roomId)
    if (userCount >= 2) {
      throw new BadRequestException('Room is full')
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

  private createNickName(): string {
    const randomAnimal = this.animals[Math.floor(Math.random() * this.animals.length)]
    return `guest_${randomAnimal}`
  }

  private compareAndRecreateNickName(nickNameInRoom: string, nickName: string): string {
    if (nickNameInRoom !== nickName) {
      return nickName
    }
    const newNickName = this.createNickName()
    return this.compareAndRecreateNickName(nickNameInRoom, newNickName)
  }
}
