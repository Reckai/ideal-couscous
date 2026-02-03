import type { MatchFoundDTO } from '../dto/swipes.dto'
import {
  Injectable,
  Logger,
} from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { RoomStatus } from 'generated/prisma'
import { MediaRepository } from '../../media/repositories/media.repository'
import { RoomCacheRepository, RoomRepository } from '../../room/repositories'
import { SwipeAction } from '../dto/swipes.dto'
import { MatchingCacheRepository } from '../repositories/matching-cache.repository'
import { RoomStateService } from './room-state.service'

@Injectable()
export class SwipeService {
  private readonly logger = new Logger(SwipeService.name)

  constructor(
    private readonly mediaRepository: MediaRepository,
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
      throw new WsException('Room not found')
    }

    const isMember = await this.roomCache.isUserInRoom(roomId, userId)
    if (!isMember) {
      throw new WsException('You are not a member of this room')
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

    const media = await this.mediaRepository.findById(mediaId)

    if (!media) {
      throw new WsException('Media not found')
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
    await this.roomRepo.createMatch(roomId, mediaId)
    await this.roomCache.updateRoomStatus(roomId, RoomStatus.MATCHED)
    this.logger.log(`Match saved and room ${roomId} status updated to MATCHED`)
  }
}
