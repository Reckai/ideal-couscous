import { Module } from '@nestjs/common';
import { RoomCacheRepository, RoomRepository } from './repositories';
import { UserModule } from '../user/user.module';

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
