import type { SwipeAction } from '../dto/swipes.dto'

export abstract class AbstractMatchingCacheRepository {
  abstract saveSwipe(roomId: string, userId: string, mediaId: string, action: SwipeAction): Promise<void>
  abstract getSwipe(roomId: string, userId: string, mediaId: string): Promise<SwipeAction | null>
  abstract getSwipesForMedia(roomId: string, mediaId: string, hostId: string, guestId: string): Promise<{ hostSwipe: SwipeAction | null, guestSwipe: SwipeAction | null }>
  abstract getAllSwipes(roomId: string): Promise<Record<string, string>>
  abstract getUserSwipeCount(roomId: string, userId: string): Promise<number>
}
