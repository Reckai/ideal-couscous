import type { MatchFoundDTO } from '../dto/swipes.dto'
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { RoomStatus } from 'generated/prisma'
import { PrismaService } from '../../Prisma/prisma.service'
import { RoomCacheRepository, RoomRepository } from '../../room/repositories'
import { SwipeAction } from '../dto/swipes.dto'
import { MatchingCacheRepository } from '../repositories/matching-cache.repository'
import { RoomStateService } from './room-state.service'

@Injectable()
export class SwipeService {
  private readonly logger = new Logger(SwipeService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly roomRepo: RoomRepository,
    private readonly roomCache: RoomCacheRepository,
    private readonly matchingCache: MatchingCacheRepository,
    private readonly roomStateService: RoomStateService,
  ) {}

  async processSwipe(
    action: SwipeAction,
    userId: string,
    roomId: string,
    mediaId: string,
  ): Promise<{ isMatch: boolean, matchData?: MatchFoundDTO }> {
    const room = await this.roomStateService.validateRoomStatus(roomId)
    if (!room) {
      throw new NotFoundException('Room not found')
    }

    const isMember = await this.roomCache.isUserInRoom(roomId, userId)
    if (!isMember) {
      throw new BadRequestException('You are not a member of this room')
    }

    const users = await this.roomCache.getUsersInRoom(roomId)
    const hostId = await this.roomCache.getHostId(roomId)
    const guestId = users.find((u) => u.userId !== hostId)?.userId || null

    await this.matchingCache.saveSwipe(roomId, userId, mediaId, action)

    this.logger.log(
      `User ${userId} swiped ${action} on media ${mediaId} in room ${roomId}`,
    )

    const { hostSwipe, guestSwipe } = await this.matchingCache.getSwipesForMedia(
      roomId,
      mediaId,
      hostId,
      guestId,
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

    await this.saveMatchAndUpdateRoom(roomId, mediaId)

    const matchData: MatchFoundDTO = {
      mediaId: media.id,
      mediaTitle: media.title,
      posterPath: media.posterPath,
      matchedAt: new Date(),
    }

    return { isMatch: true, matchData }
  }

  private checkMatch(hostSwipe: SwipeAction, guestSwipe: SwipeAction): boolean {
    return hostSwipe === SwipeAction.LIKE && guestSwipe === SwipeAction.LIKE
  }

  private async saveMatchAndUpdateRoom(roomId: string, mediaId: string): Promise<void> {
    try {
      await this.roomRepo.createMatch(roomId, mediaId)
      await this.roomRepo.updateStatus(roomId, RoomStatus.MATCHED)
      await this.roomCache.updateRoomStatus(roomId, RoomStatus.MATCHED)
      this.logger.log(`Match saved and room ${roomId} status updated to MATCHED`)
    } catch (err) {
      this.logger.error(`Failed to save match/update room: ${err.message}`)
    }
  }
}
