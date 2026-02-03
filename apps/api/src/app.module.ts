import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AnonymousUserGuard } from './common/guards/anonymous-user.guard'
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
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string>('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    UserModule, // MVP v1: Анонимные пользователи
    RoomModule,
    MediaModule,
    MatchingModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AnonymousUserGuard,
    },
  ],
})
export class AppModule {}
