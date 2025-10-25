// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configutation';

import { PrismaModule } from './Prisma/prisma.module';
import { RoomModule } from './room/room.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module'; // ← добавить импорт

@Module({
  imports: [
    PrismaModule,
    RoomModule,
    RedisModule, // ← добавить сюда
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
