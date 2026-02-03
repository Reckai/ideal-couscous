import { Global, Module } from '@nestjs/common'
import { RedisService } from './redis.service'

/**
 * @Global - RedisService is available in all modules
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
