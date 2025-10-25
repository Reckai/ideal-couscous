import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomCacheRepository, RoomRepository } from './repositories';

@Module({
  controllers: [RoomController],
  providers: [
    RoomService,
    RoomRepository, // PostgreSQL operations
    RoomCacheRepository,
  ],
  exports: [RoomRepository, RoomCacheRepository, RoomService],
})
export class RoomModule {}
