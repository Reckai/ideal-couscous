// apps/api/src/matching/matching.module.ts

import { Module } from '@nestjs/common';
import { MatchingGateway } from './matching.gateway';
import { MatchingService } from './matching.service';
import { MatchingCacheRepository } from './repositories/matching-cache.repository';
import { RoomModule } from '../room/room.module';

@Module({
  imports: [RoomModule], // Import RoomModule for repositories
  providers: [MatchingGateway, MatchingService, MatchingCacheRepository],
  exports: [MatchingService], // Export if needed by other modules
})
export class MatchingModule {}
