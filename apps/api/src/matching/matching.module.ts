// apps/api/src/matching/matching.module.ts

import { Module } from '@nestjs/common'
import { RoomModule } from '../room/room.module'
import { UserModule } from '../user'
import { MatchingGateway } from './matching.gateway'
import { MatchingService } from './matching.service'
import { MatchingCacheRepository } from './repositories/matching-cache.repository'

@Module({
  imports: [RoomModule, UserModule], // Import RoomModule for repositories
  providers: [MatchingGateway, MatchingService, MatchingCacheRepository],
  exports: [MatchingService], // Export if needed by other modules
})
export class MatchingModule {}
