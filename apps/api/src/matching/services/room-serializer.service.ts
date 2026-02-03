import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { BaseRoomData, RoomData, RoomStatus as SharedRoomStatus } from '@netflix-tinder/shared'
import { PrismaService } from '../../Prisma/prisma.service'
import { RoomCacheRepository } from '../../room/repositories'

@Injectable()
export class RoomSerializerService {
  private readonly logger = new Logger(RoomSerializerService.name)

  constructor(
    private readonly roomCache: RoomCacheRepository,
    private readonly prisma: PrismaService,
  ) {}

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

  async getSnapshotOfRoom(roomId: string, userId: string): Promise<RoomData> {
    const status = await this.roomCache.getRoomStatus(roomId)
    const basicData = await this.getRoomData(roomId)

    switch (status) {
      case 'WAITING':
        return {
          ...basicData,
          status: 'WAITING',
        }
      case 'SELECTING': {
        const selectedAnime = await this.roomCache.getRoomDraft(roomId, userId)
        return {
          ...basicData,
          selectedAnime,
          status: 'SELECTING',
        }
      }
      case 'SWIPING': {
        const mediaPool = await this.roomCache.getMediaPool(roomId)
        return {
          ...basicData,
          status: 'SWIPING',
          currentMediaIndex: 0,
          mediaQueue: mediaPool,
        }
      }
      case 'MATCHED':
        return {
          ...basicData,
          status: 'MATCHED',
          matchId: '2511d0b7-2067-423c-a082-c29377cd8551',
        }
      default:
        throw new NotFoundException('Room not found')
    }
  }

  async getMediaPoolWithDetails(roomId: string) {
    const mediaIds = await this.roomCache.getMediaPool(roomId)

    const media = await this.prisma.media.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, title: true, posterPath: true },
    })

    return mediaIds.map((id) => media.find((m) => m.id === id))
  }
}
