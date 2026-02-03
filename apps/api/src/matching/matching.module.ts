import { Module } from '@nestjs/common'
import { RoomModule } from '../room/room.module'
import { UserModule } from '../user'
import { MatchingGateway } from './matching.gateway'
import { MatchingService } from './matching.service'
import { MatchingCacheRepository } from './repositories/matching-cache.repository'
import { RoomLifecycleService } from './services/room-lifecycle.service'
import { RoomSerializerService } from './services/room-serializer.service'
import { RoomStateService } from './services/room-state.service'
import { SelectionService } from './services/selection.service'
import { SwipeService } from './services/swipe.service'

@Module({
  imports: [RoomModule, UserModule],
  providers: [
    MatchingGateway,
    MatchingService,
    RoomLifecycleService,
    RoomStateService,
    SelectionService,
    SwipeService,
    RoomSerializerService,
    MatchingCacheRepository,
  ],
  exports: [MatchingService],
})
export class MatchingModule {}
