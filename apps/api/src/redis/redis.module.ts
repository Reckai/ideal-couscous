import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * @Global - RedisService доступен во всех модулях
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
