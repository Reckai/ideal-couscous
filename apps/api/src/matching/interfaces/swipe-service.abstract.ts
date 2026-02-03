import type { MatchFoundDTO, SwipeAction } from '../dto/swipes.dto'

export abstract class AbstractSwipeService {
  abstract processSwipe(action: SwipeAction, userId: string, roomId: string, mediaId: string): Promise<{ isMatch: boolean, matchData?: MatchFoundDTO }>
}
