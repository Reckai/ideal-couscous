// apps/api/src/modules/room/repositories/room-cache.repository.ts

import { Injectable, Logger } from '@nestjs/common';
import { RoomStatus } from 'generated/prisma';
import { RedisService } from 'src/redis/redis.service';

/**
 * Структура состояния комнаты в Redis
 */
export interface RoomState {
  status: RoomStatus;
  hostReady: boolean;
  guestReady: boolean;
  currentMediaIndex: number;
}

/**
 * Repository для работы с Room data в Redis
 */
@Injectable()
export class RoomCacheRepository {
  private readonly logger = new Logger(RoomCacheRepository.name);
  private readonly ROOM_TTL = 30 * 60; // 30 минут в секундах

  // Redis key patterns
  private readonly KEYS = {
    roomState: (roomId: string) => `room:${roomId}:state`,
    userSelections: (roomId: string, userId: string) =>
      `room:${roomId}:user:${userId}:selections`,
    mediaPool: (roomId: string) => `room:${roomId}:media_pool`,
    swipes: (roomId: string) => `room:${roomId}:swipes`,
  };

  constructor(private readonly redis: RedisService) {}

  // ============================================================================
  // ROOM STATE OPERATIONS
  // ============================================================================

  /**
   * Инициализировать состояние комнаты
   */
  async initRoomState(roomId: string, status: RoomStatus): Promise<void> {
    const key = this.KEYS.roomState(roomId);
    this.logger.debug(`Initializing room state: ${roomId}`);

    try {
      // HSET принимает плоский объект или пары key-value
      await this.redis.hset(key, {
        status,
        hostReady: 'false',
        guestReady: 'false',
        currentMediaIndex: '0',
      });
      await this.redis.expire(key, this.ROOM_TTL);
    } catch (error) {
      this.logger.error(
        `Failed to init room state ${roomId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Получить состояние комнаты
   *
   * @param roomId - ID комнаты
   * @returns Состояние или null если не найдено
   */
  async getRoomState(roomId: string): Promise<RoomState | null> {
    const key = this.KEYS.roomState(roomId);

    try {
      // ✅ Добавляем await!
      const data = await this.redis.hgetall(key);

      // Проверка на пустой объект
      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      // Парсинг строк в нужные типы
      return {
        status: data.status as RoomStatus,
        hostReady: data.hostReady === 'true',
        guestReady: data.guestReady === 'true',
        currentMediaIndex: parseInt(data.currentMediaIndex || '0', 10),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get room state ${roomId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Обновить статус комнаты
   */
  async updateRoomStatus(roomId: string, status: RoomStatus): Promise<void> {
    const key = this.KEYS.roomState(roomId);
    this.logger.debug(`Updating room ${roomId} status to ${status}`);

    try {
      await this.redis.hset(key, 'status', status);
      await this.redis.expire(key, this.ROOM_TTL); // Refresh TTL
    } catch (error) {
      this.logger.error(
        `Failed to update room status ${roomId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Установить готовность пользователя
   */
  async setUserReadiness(
    roomId: string,
    isHost: boolean,
    ready: boolean,
  ): Promise<void> {
    const key = this.KEYS.roomState(roomId);
    const field = isHost ? 'hostReady' : 'guestReady';

    try {
      await this.redis.hset(key, field, ready.toString());
      await this.redis.expire(key, this.ROOM_TTL);
    } catch (error) {
      this.logger.error(
        `Failed to set user readiness ${roomId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Проверить готовы ли оба участника
   */
  async areBothReady(roomId: string): Promise<boolean> {
    const state = await this.getRoomState(roomId);
    return state ? state.hostReady && state.guestReady : false;
  }

  // ============================================================================
  // USER SELECTIONS OPERATIONS
  // ============================================================================

  /**
   * Сохранить выборы пользователя
   */
  async saveUserSelections(
    roomId: string,
    userId: string,
    mediaIds: string[],
  ): Promise<void> {
    const key = this.KEYS.userSelections(roomId, userId);
    this.logger.debug(
      `Saving ${mediaIds.length} selections for user ${userId} in room ${roomId}`,
    );

    try {
      if (mediaIds.length === 0) {
        return;
      }

      // SADD автоматически убирает дубликаты
      await this.redis.sadd(key, ...mediaIds);
      await this.redis.expire(key, this.ROOM_TTL);
    } catch (error) {
      this.logger.error(
        `Failed to save user selections: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Получить выборы пользователя
   */
  async getUserSelections(roomId: string, userId: string): Promise<string[]> {
    const key = this.KEYS.userSelections(roomId, userId);

    try {
      return await this.redis.smembers(key);
    } catch (error) {
      this.logger.error(
        `Failed to get user selections: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Проверить сохранил ли пользователь выборы
   */
  async hasUserSelections(roomId: string, userId: string): Promise<boolean> {
    const key = this.KEYS.userSelections(roomId, userId);

    try {
      const count = await this.redis.scard(key);
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check user selections: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ============================================================================
  // MEDIA POOL OPERATIONS
  // ============================================================================

  /**
   * Создать media pool для свайпинга
   */
  async createMediaPool(roomId: string, mediaIds: string[]): Promise<void> {
    const key = this.KEYS.mediaPool(roomId);
    this.logger.debug(
      `Creating media pool for room ${roomId}: ${mediaIds.length} items`,
    );

    try {
      if (mediaIds.length === 0) {
        this.logger.warn(`Empty media pool for room ${roomId}`);
        return;
      }

      // Очищаем старый pool
      await this.redis.del(key);

      // RPUSH добавляет в конец списка
      await this.redis.rpush(key, ...mediaIds);
      await this.redis.expire(key, this.ROOM_TTL);
    } catch (error) {
      this.logger.error(
        `Failed to create media pool: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Получить media pool
   */
  async getMediaPool(roomId: string): Promise<string[]> {
    const key = this.KEYS.mediaPool(roomId);

    try {
      return await this.redis.lrange(key, 0, -1); // Все элементы
    } catch (error) {
      this.logger.error(
        `Failed to get media pool: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Получить размер media pool
   */
  async getMediaPoolSize(roomId: string): Promise<number> {
    const key = this.KEYS.mediaPool(roomId);

    try {
      return await this.redis.llen(key);
    } catch (error) {
      this.logger.error(
        `Failed to get media pool size: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ============================================================================
  // SWIPES OPERATIONS
  // ============================================================================

  /**
   * Сохранить свайп пользователя
   */
  async saveSwipe(
    roomId: string,
    userId: string,
    mediaId: string,
    liked: boolean,
  ): Promise<void> {
    const key = this.KEYS.swipes(roomId);
    const field = `${userId}:${mediaId}`;
    const value = liked ? 'LIKE' : 'SKIP';

    try {
      await this.redis.hset(key, field, value);
      await this.redis.expire(key, this.ROOM_TTL);
    } catch (error) {
      this.logger.error(`Failed to save swipe: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Получить свайп пользователя на конкретный медиа
   */
  async getSwipe(
    roomId: string,
    userId: string,
    mediaId: string,
  ): Promise<'LIKE' | 'SKIP' | null> {
    const key = this.KEYS.swipes(roomId);
    const field = `${userId}:${mediaId}`;

    try {
      const value = await this.redis.hget(key, field);
      return value as 'LIKE' | 'SKIP' | null;
    } catch (error) {
      this.logger.error(`Failed to get swipe: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Получить все свайпы для конкретного медиа
   */
  async getSwipesForMedia(
    roomId: string,
    mediaId: string,
    hostId: string,
    guestId: string,
  ): Promise<{
    hostSwipe: 'LIKE' | 'SKIP' | null;
    guestSwipe: 'LIKE' | 'SKIP' | null;
  }> {
    const key = this.KEYS.swipes(roomId);

    try {
      const [hostSwipe, guestSwipe] = await Promise.all([
        this.redis.hget(key, `${hostId}:${mediaId}`),
        this.redis.hget(key, `${guestId}:${mediaId}`),
      ]);

      return {
        hostSwipe: hostSwipe as 'LIKE' | 'SKIP' | null,
        guestSwipe: guestSwipe as 'LIKE' | 'SKIP' | null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get swipes for media: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Проверить есть ли матч
   */
  async isMatch(
    roomId: string,
    mediaId: string,
    hostId: string,
    guestId: string,
  ): Promise<boolean> {
    const { hostSwipe, guestSwipe } = await this.getSwipesForMedia(
      roomId,
      mediaId,
      hostId,
      guestId,
    );

    return hostSwipe === 'LIKE' && guestSwipe === 'LIKE';
  }

  /**
   * Получить все свайпы комнаты
   */
  async getAllSwipes(roomId: string): Promise<Record<string, string>> {
    const key = this.KEYS.swipes(roomId);

    try {
      return await this.redis.hgetall(key);
    } catch (error) {
      this.logger.error(
        `Failed to get all swipes: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Получить количество свайпов пользователя
   */
  async getUserSwipeCount(roomId: string, userId: string): Promise<number> {
    const allSwipes = await this.getAllSwipes(roomId);
    const userPrefix = `${userId}:`;

    return Object.keys(allSwipes).filter((key) => key.startsWith(userPrefix))
      .length;
  }

  // ============================================================================
  // CLEANUP OPERATIONS
  // ============================================================================

  /**
   * Удалить все данные комнаты
   */
  async deleteRoomData(
    roomId: string,
    hostId: string,
    guestId?: string,
  ): Promise<void> {
    this.logger.debug(`Deleting all Redis data for room ${roomId}`);

    try {
      const keys = [
        this.KEYS.roomState(roomId),
        this.KEYS.userSelections(roomId, hostId),
        this.KEYS.mediaPool(roomId),
        this.KEYS.swipes(roomId),
      ];

      if (guestId) {
        keys.push(this.KEYS.userSelections(roomId, guestId));
      }

      await this.redis.del(...keys);
      this.logger.log(`Deleted ${keys.length} keys for room ${roomId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete room data: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Продлить TTL всех ключей комнаты
   */
  async refreshRoomTTL(
    roomId: string,
    hostId: string,
    guestId?: string,
  ): Promise<void> {
    try {
      const keys = [
        this.KEYS.roomState(roomId),
        this.KEYS.userSelections(roomId, hostId),
        this.KEYS.mediaPool(roomId),
        this.KEYS.swipes(roomId),
      ];

      if (guestId) {
        keys.push(this.KEYS.userSelections(roomId, guestId));
      }

      await Promise.all(
        keys.map((key) => this.redis.expire(key, this.ROOM_TTL)),
      );
    } catch (error) {
      this.logger.error(
        `Failed to refresh room TTL: ${error.message}`,
        error.stack,
      );
      // Не бросаем ошибку - это не критично
    }
  }

  /**
   * Проверить существует ли комната
   */
  async roomExists(roomId: string): Promise<boolean> {
    const key = this.KEYS.roomState(roomId);

    try {
      const exists = await this.redis.exists(key);
      return exists > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check room existence: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ============================================================================
  // ANALYTICS / METRICS
  // ============================================================================

  /**
   * Получить статистику комнаты
   */
  async getRoomStats(
    roomId: string,
    hostId: string,
    guestId?: string,
  ): Promise<{
    state: RoomState | null;
    hostSelectionsCount: number;
    guestSelectionsCount: number;
    mediaPoolSize: number;
    totalSwipes: number;
    hostSwipes: number;
    guestSwipes: number;
  }> {
    try {
      const [state, hostSelections, guestSelections, mediaPoolSize, allSwipes] =
        await Promise.all([
          this.getRoomState(roomId),
          this.getUserSelections(roomId, hostId),
          guestId
            ? this.getUserSelections(roomId, guestId)
            : Promise.resolve([]),
          this.getMediaPoolSize(roomId),
          this.getAllSwipes(roomId),
        ]);

      const hostSwipes = Object.keys(allSwipes).filter((key) =>
        key.startsWith(`${hostId}:`),
      ).length;

      const guestSwipes = guestId
        ? Object.keys(allSwipes).filter((key) => key.startsWith(`${guestId}:`))
            .length
        : 0;

      return {
        state,
        hostSelectionsCount: hostSelections.length,
        guestSelectionsCount: guestSelections.length,
        mediaPoolSize,
        totalSwipes: Object.keys(allSwipes).length,
        hostSwipes,
        guestSwipes,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get room stats: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
