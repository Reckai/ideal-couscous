// app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'

import configuration from './config/configutation'
import { MatchingModule } from './matching/matching.module'
import { MediaModule } from './media/media.module'
import { PrismaModule } from './Prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { RoomModule } from './room/room.module'
import { UserModule } from './user'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
    }),
    PrismaModule,
    RedisModule,
    UserModule, // MVP v1: Анонимные пользователи
    RoomModule,
    MediaModule,
    MatchingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
