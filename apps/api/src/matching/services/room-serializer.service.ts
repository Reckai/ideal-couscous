import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { BaseRoomData, RoomData, RoomStatus as SharedRoomStatus } from '@netflix-tinder/shared'
import { AbstractMediaRepository } from '../../media/interfaces'
import { PrismaService } from '../../Prisma/prisma.service'
import { AbstractRoomCacheRepository } from '../../room/interfaces'
import { AbstractRoomSerializerService } from '../interfaces'

@Injectable()
export class RoomSerializerService extends AbstractRoomSerializerService {
  private readonly logger = new Logger(RoomSerializerService.name)

  constructor(
    private readonly roomCache: AbstractRoomCacheRepository,
    private readonly prisma: PrismaService,
    private readonly mediaRepository: AbstractMediaRepository,
  ) {
    super()
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
      case 'MATCHED': {
        const match = await this.prisma.roomMatch.findUnique({
          where: { roomId },
          select: { id: true },
        })
        return {
          ...basicData,
          status: 'MATCHED',
          matchId: match?.id ?? null,
        }
      }
      default:
        throw new NotFoundException('Room not found')
    }
  }

  async getMediaPoolWithDetails(roomId: string) {
    const mediaIds = await this.roomCache.getMediaPool(roomId)
    const media = await this.mediaRepository.findManyByIds(mediaIds)
    return mediaIds.map((id) => media.find((m) => m.id === id))
  }
}
