import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomCacheRepository, RoomRepository } from './repositories';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule], // Needed for AnonymousUserGuard in RoomController
  controllers: [RoomController],
  providers: [
    RoomService,
    RoomRepository, // PostgreSQL operations
    RoomCacheRepository,
  ],
  exports: [RoomRepository, RoomCacheRepository, RoomService],
})
export class RoomModule {}
