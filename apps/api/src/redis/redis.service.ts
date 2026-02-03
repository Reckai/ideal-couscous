// apps/api/src/redis/redis.service.ts

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { RedisOptions } from 'ioredis'
import {
  Injectable,
  Logger,

} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

/**
 * Redis Service - wrapper over ioredis
 * Manages connection lifecycle
 */
@Injectable()
export class RedisService
  extends Redis
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)

  constructor(private readonly configService: ConfigService) {
    const options: RedisOptions = {
      host: configService.get<string>('redis.host', 'localhost'),
      port: configService.get<number>('redis.port', 6379),
      password: configService.get<string>('redis.password'),
      retryStrategy: (times: number) => {
        return Math.min(times * 50, 2000)
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true, // Connect explicitly in onModuleInit
    }

    super(options)

    // Event listeners
    this.on('connect', () => {
      this.logger.log('Redis connecting...')
    })

    this.on('ready', () => {
      this.logger.log('Redis connected and ready')
    })

    this.on('error', (error) => {
      this.logger.error('Redis error:', error.message)
    })

    this.on('close', () => {
      this.logger.warn('Redis connection closed')
    })

    this.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting...')
    })
  }

  async onModuleInit() {
    try {
      await this.connect()
      this.logger.log('Redis service initialized')
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error.message)
      throw error
    }
  }

  async onModuleDestroy() {
    try {
      await this.quit()
      this.logger.log('Redis connection closed gracefully')
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error.message)
    }
  }

  /**
   * Health check for Redis
   * Used in /health endpoint
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.ping()
      return result === 'PONG'
    } catch (error) {
      this.logger.error('Redis health check failed:', error.message)
      return false
    }
  }

  /**
   * Get Redis server information
   */
  async getInfo(): Promise<{
    version: string
    connectedClients: number
    usedMemory: string
    uptime: number
  }> {
    const info = await this.info()
    const lines = info.split('\r\n')

    const getValue = (key: string): string => {
      const line = lines.find((l) => l.startsWith(key))
      return line ? line.split(':')[1] : 'unknown'
    }

    return {
      version: getValue('redis_version'),
      connectedClients: Number.parseInt(getValue('connected_clients'), 10),
      usedMemory: getValue('used_memory_human'),
      uptime: Number.parseInt(getValue('uptime_in_seconds'), 10),
    }
  }
}
