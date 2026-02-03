import { Module } from '@nestjs/common'
import { MediaModule } from '../media/media.module'
import { RoomModule } from '../room/room.module'
import { UserModule } from '../user'
import {
  AbstractMatchingCacheRepository,
  AbstractMatchingService,
  AbstractRoomLifecycleService,
  AbstractRoomSerializerService,
  AbstractRoomStateService,
  AbstractSelectionService,
  AbstractSwipeService,
} from './interfaces'
import { MatchingGateway } from './matching.gateway'
import { MatchingService } from './matching.service'
import { MatchingCacheRepository } from './repositories/matching-cache.repository'
import { RoomLifecycleService } from './services/room-lifecycle.service'
import { RoomSerializerService } from './services/room-serializer.service'
import { RoomStateService } from './services/room-state.service'
import { SelectionService } from './services/selection.service'
import { SwipeService } from './services/swipe.service'

@Module({
  imports: [RoomModule, UserModule, MediaModule],
  providers: [
    MatchingGateway,
    { provide: AbstractMatchingService, useClass: MatchingService },
    { provide: AbstractRoomLifecycleService, useClass: RoomLifecycleService },
    { provide: AbstractRoomStateService, useClass: RoomStateService },
    { provide: AbstractSelectionService, useClass: SelectionService },
    { provide: AbstractSwipeService, useClass: SwipeService },
    { provide: AbstractRoomSerializerService, useClass: RoomSerializerService },
    { provide: AbstractMatchingCacheRepository, useClass: MatchingCacheRepository },
  ],
  exports: [AbstractMatchingService],
})
export class MatchingModule {}
