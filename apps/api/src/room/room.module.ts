import { Module } from '@nestjs/common'
import { UserModule } from '../user'
import { RoomCacheRepository, RoomRepository } from './repositories'
import { DisconnectTimerService } from './services/disconnectTime.service'

@Module({
  imports: [UserModule], // Needed for AnonymousUserGuard in RoomController
  controllers: [],
  providers: [
    DisconnectTimerService,
    RoomRepository, // PostgreSQL operations
    RoomCacheRepository,
  ],
  exports: [DisconnectTimerService, RoomRepository, RoomCacheRepository],
})
export class RoomModule {}
