// apps/api/src/redis/redis.service.ts

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

/**
 * Redis Service - обёртка над ioredis
 * Управляет connection lifecycle
 */
@Injectable()
export class RedisService
  extends Redis
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    const options: RedisOptions = {
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD'),
      db: configService.get<number>('REDIS_DB', 0),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true, // Подключаемся явно в onModuleInit
    };

    super(options);

    // Event listeners
    this.on('connect', () => {
      this.logger.log('Redis connecting...');
    });

    this.on('ready', () => {
      this.logger.log('Redis connected and ready');
    });

    this.on('error', (error) => {
      this.logger.error('Redis error:', error.message);
    });

    this.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting...');
    });
  }

  async onModuleInit() {
    try {
      await this.connect();
      this.logger.log('Redis service initialized');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.quit();
      this.logger.log('Redis connection closed gracefully');
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error.message);
    }
  }

  /**
   * Health check для Redis
   * Используется в /health endpoint
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check failed:', error.message);
      return false;
    }
  }

  /**
   * Получить информацию о Redis сервере
   */
  async getInfo(): Promise<{
    version: string;
    connectedClients: number;
    usedMemory: string;
    uptime: number;
  }> {
    const info = await this.info();
    const lines = info.split('\r\n');

    const getValue = (key: string): string => {
      const line = lines.find((l) => l.startsWith(key));
      return line ? line.split(':')[1] : 'unknown';
    };

    return {
      version: getValue('redis_version'),
      connectedClients: parseInt(getValue('connected_clients'), 10),
      usedMemory: getValue('used_memory_human'),
      uptime: parseInt(getValue('uptime_in_seconds'), 10),
    };
  }
}
