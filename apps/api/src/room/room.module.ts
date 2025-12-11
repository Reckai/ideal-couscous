import { Module } from '@nestjs/common'
import { UserModule } from '../user'
import { RoomCacheRepository, RoomRepository } from './repositories'

@Module({
  imports: [UserModule], // Needed for AnonymousUserGuard in RoomController
  controllers: [],
  providers: [
    RoomRepository, // PostgreSQL operations
    RoomCacheRepository,
  ],
  exports: [RoomRepository, RoomCacheRepository],
})
export class RoomModule {}
