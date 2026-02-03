import { Module } from '@nestjs/common'
import { UserModule } from '../user'
import { AbstractDisconnectTimerService, AbstractRoomCacheRepository, AbstractRoomRepository } from './interfaces'
import { RoomCacheRepository, RoomRepository } from './repositories'
import { DisconnectTimerService } from './services/disconnectTime.service'

@Module({
  imports: [UserModule], // Needed for AnonymousUserGuard in RoomController
  controllers: [],
  providers: [
    { provide: AbstractDisconnectTimerService, useClass: DisconnectTimerService },
    { provide: AbstractRoomRepository, useClass: RoomRepository },
    { provide: AbstractRoomCacheRepository, useClass: RoomCacheRepository },
  ],
  exports: [AbstractDisconnectTimerService, AbstractRoomRepository, AbstractRoomCacheRepository],
})
export class RoomModule {}
