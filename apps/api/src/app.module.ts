// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configutation';

import { PrismaModule } from './Prisma/prisma.module';
import { RoomModule } from './room/room.module';
import { UserModule } from './user';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { MediaModule } from './media/media.module';
import { MatchingModule } from './matching/matching.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    UserModule, // MVP v1: Анонимные пользователи
    RoomModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
    }),
    MediaModule,
    MatchingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
