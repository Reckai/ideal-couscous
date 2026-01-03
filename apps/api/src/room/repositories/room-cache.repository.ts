// apps/api/src/modules/room/repositories/room-cache.repository.ts

import { Injectable, Logger } from '@nestjs/common'
import { RoomStatus } from 'generated/prisma'
import { User } from '../../matching/types/user'
import { RedisService } from '../../redis/redis.service'

/**
 * Структура состояния комнаты в Redis
 */
export interface RoomState {
  status: RoomStatus
  hostReady: boolean
  guestReady: boolean
  currentMediaIndex: number
}

/**
 * Repository для работы с Room data в Redis
 */
@Injectable()
export class RoomCacheRepository {
  private readonly logger = new Logger(RoomCacheRepository.name)
  private readonly ROOM_TTL = 30 * 60 // 30 минут в секундах

  // Redis key patterns
  private readonly KEYS = {
    roomState: (roomId: string) => `room:${roomId}:state`,
    roomDraft: (roomId: string) => `room:${roomId}:draft`,
    userSelections: (roomId: string, userId: string) => `room:${roomId}:user:${userId}:selections`,
    mediaPool: (roomId: string) => `room:${roomId}:media_pool`,
    swipes: (roomId: string) => `room:${roomId}:swipes`,
    users: (roomId: string) => `room:${roomId}:users`,
    userInRoom: (userId: string) => `user:${userId}:room`,
    userStatus: (roomId: string, userId: string) => `room:${roomId}:user:${userId}:status`,
  }

  constructor(private readonly redis: RedisService) { }

  // ============================================================================
  // ROOM STATE OPERATIONS
  // ============================================================================

  /**
   * Инициализировать состояние комнаты
   */
  async initRoom(roomId: string, hostId: string, nickName: string): Promise<void> {
    const key = this.KEYS.roomState(roomId)
    this.logger.debug(`Initializing room state: ${roomId}`)

    try {
      await this.redis.hset(key, {
        status: RoomStatus.WAITING,
        hostId,
        hostReady: 'false',
        guestReady: 'false',
        createdAt: Date.now(),
      })
      await this.redis.expire(key, this.ROOM_TTL)
      await this.addUserToRoom(roomId, hostId, nickName)
      await this.redis.expire(this.KEYS.users(roomId), this.ROOM_TTL)
    } catch (error) {
      this.logger.error(
        `Failed to init room state ${roomId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  async validateRoomExistence(roomId: string): Promise<boolean> {
    const key = this.KEYS.roomState(roomId)
    const exists = await this.redis.exists(key)
    return Boolean(exists)
  }

  async getRoomUserCount(roomId: string): Promise<number> {
    const key = this.KEYS.users(roomId)
    return this.redis.hlen(key)
  }

  async getNameOfUserInRoom(roomId: string, userId: string): Promise<string> {
    const key = this.KEYS.users(roomId)
    const result = await this.redis.hget(key, userId)
    if (!result) {
      return null
    };
    const user: User = JSON.parse(result)
    return user.nickName
  }

  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    const key = this.KEYS.users(roomId)
    const result = await this.redis.hexists(key, userId)
    return result === 1
  }

  async markUserAsDisconnected(roomId: string, userId: string): Promise<void> {
    const key = this.KEYS.userStatus(roomId, userId)
    await this.redis.set(key, 'disconnecting', 'EX', 30)
  }

  async isUserDisconnected(roomId: string, userId: string): Promise<boolean> {
    const key = this.KEYS.userStatus(roomId, userId)
    const result = await this.redis.get(key)
    return result === 'disconnecting'
  }

  /**
   * Получить состояние комнаты
   *
   * @param roomId - ID комнаты
   * @returns Состояние или null если не найдено
   */
  async getRoomState(roomId: string): Promise<RoomState | null> {
    const key = this.KEYS.roomState(roomId)

    try {
      // ✅ Добавляем await!
      const data = await this.redis.hgetall(key)

      // Проверка на пустой объект
      if (!data || Object.keys(data).length === 0) {
        return null
      }

      // Парсинг строк в нужные типы
      return {
        status: data.status as RoomStatus,
        hostReady: data.hostReady === 'true',
        guestReady: data.guestReady === 'true',
        currentMediaIndex: Number.parseInt(data.currentMediaIndex || '0', 10),
      }
    } catch (error) {
      this.logger.error(
        `Failed to get room state ${roomId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  async getRoomStatus(roomId: string): Promise<RoomStatus> {
    return this.redis.hget(
      this.KEYS.roomState(roomId),
      'status',
    ) as Promise<RoomStatus>
  }

  /**
   * Обновить статус комнаты
   */
  async updateRoomStatus(roomId: string, status: RoomStatus): Promise<void> {
    const key = this.KEYS.roomState(roomId)
    this.logger.debug(`Updating room ${roomId} status to ${status}`)

    try {
      await this.redis.hset(key, 'status', status)
      await this.redis.expire(key, this.ROOM_TTL) // Refresh TTL
    } catch (error) {
      this.logger.error(
        `Failed to update room status ${roomId}: ${error.message}`,
        error.stack,
      )
      throw error
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
    const key = this.KEYS.roomState(roomId)
    const field = isHost ? 'hostReady' : 'guestReady'

    try {
      await this.redis.hset(key, field, ready.toString())
      await this.redis.expire(key, this.ROOM_TTL)
    } catch (error) {
      this.logger.error(
        `Failed to set user readiness ${roomId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Проверить готовы ли оба участника
   */
  async areBothReady(roomId: string): Promise<boolean> {
    const state = await this.getRoomState(roomId)
    return state ? state.hostReady && state.guestReady : false
  }

  async getHostId(roomId: string): Promise<string> {
    const key = this.KEYS.roomState(roomId)
    return this.redis.hget(key, 'hostId')
  }

  async isUserHost(roomId: string, userId: string): Promise<boolean> {
    const key = this.KEYS.roomState(roomId)
    const hostId = await this.redis.hget(key, 'hostId')
    return hostId === userId
  }

  // ============================================================================
  // USER SELECTIONS OPERATIONS
  // ============================================================================

  /**
   * Сохранить выбор пользователя
   */
  async saveUserSelection(roomId: string, userId: string, mediaId: string): Promise<number> {
    const key = this.KEYS.userSelections(roomId, userId)
    this.logger.debug(`Saving ${mediaId} selection for user ${userId} in room ${roomId}`)

    const count = await this.redis.scard(key)
    if (count > 50) {
      throw new Error('Draft limit reached')
    }
    // SADD автоматически убирает дубликаты
    const result = await this.redis.sadd(key, mediaId)

    await this.redis.expire(key, this.ROOM_TTL)
    return result
  }

  /**
   * Удалить выбор пользователя
   */
  async removeUserSelection(roomId: string, userId: string, mediaId: string): Promise<number> {
    const key = this.KEYS.userSelections(roomId, userId)
    return this.redis.srem(key, mediaId)
  }

  /**
   * Получить выборы конкретного пользователя
   */
  async getUserSelections(roomId: string, userId: string): Promise<string[]> {
    const key = this.KEYS.userSelections(roomId, userId)
    return this.redis.smembers(key)
  }

  async getUsersInRoom(roomId: string): Promise<User[]> {
    const key = this.KEYS.users(roomId)

    const rawUsers = await this.redis.hgetall(key)

    return Object.values(rawUsers).map((jsonString) => {
      return JSON.parse(jsonString)
    }) as User[]
  }
  /**
   * Получить выборы пользователя
   */
  // async getUserSelections(roomId: string, userId: string): Promise<string[]> {
  //   const key = this.KEYS.userSelections(roomId, userId);
  //
  //   try {
  //     return await this.redis.smembers(key);
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to get user selections: ${error.message}`,
  //       error.stack,
  //     );
  //     throw error;
  //   }
  // }

  /**
   * Проверить сохранил ли пользователь выборы
   */
  // async hasUserSelections(roomId: string, userId: string): Promise<boolean> {
  //   const key = this.KEYS.userSelections(roomId, userId);
  //
  //   try {
  //     const count = await this.redis.scard(key);
  //     return count > 0;
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to check user selections: ${error.message}`,
  //       error.stack,
  //     );
  //     throw error;
  //   }
  // }

  // ============================================================================
  // MEDIA POOL OPERATIONS
  // ============================================================================

  /**
   * Создать media pool для свайпинга
   */
  async createMediaPool(roomId: string, mediaIds: string[]): Promise<void> {
    const key = this.KEYS.mediaPool(roomId)
    this.logger.debug(
      `Creating media pool for room ${roomId}: ${mediaIds.length} items`,
    )

    try {
      if (mediaIds.length === 0) {
        this.logger.warn(`Empty media pool for room ${roomId}`)
        return
      }

      // Очищаем старый pool
      await this.redis.del(key)

      // RPUSH добавляет в конец списка
      await this.redis.rpush(key, ...mediaIds)
      await this.redis.expire(key, this.ROOM_TTL)
    } catch (error) {
      this.logger.error(
        `Failed to create media pool: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Получить media pool
   */
  async getMediaPool(roomId: string): Promise<string[]> {
    const key = this.KEYS.mediaPool(roomId)

    try {
      return await this.redis.lrange(key, 0, -1) // Все элементы
    } catch (error) {
      this.logger.error(
        `Failed to get media pool: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    const key = this.KEYS.users(roomId)
    await this.redis.hdel(key, userId)
    await this.redis.del(this.KEYS.userInRoom(userId))
  }

  async addUserToRoom(roomId: string, userId: string, nickName: string): Promise<void> {
    const key = this.KEYS.users(roomId)
    const userData: User = {
      nickName,
      userId,
    }
    await this.redis.hset(key, userId, JSON.stringify(userData))
    await this.redis.expire(key, this.ROOM_TTL)
    await this.redis.set(this.KEYS.userInRoom(userId), roomId)
    await this.redis.expire(this.KEYS.userInRoom(userId), this.ROOM_TTL)
  }

  async getRoomIdByUserId(userId: string): Promise<string> {
    return this.redis.get(this.KEYS.userInRoom(userId))
  }

  async clearRoomIdByUserId(userId: string): Promise<void> {
    await this.redis.del(this.KEYS.userInRoom(userId))
  }

  /**
   * Получить размер media pool
   */
  async getMediaPoolSize(roomId: string): Promise<number> {
    const key = this.KEYS.mediaPool(roomId)

    try {
      return await this.redis.llen(key)
    } catch (error) {
      this.logger.error(
        `Failed to get media pool size: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  // ============================================================================
  // CLEANUP OPERATIONS
  // ============================================================================

  /**
   * Удалить все данные комнаты
   */
  async deleteRoomData(roomId: string, userId: string): Promise<void> {
    this.logger.debug(`Deleting all Redis data for room ${roomId}`)

    try {
      // Сначала получаем всех пользователей, чтобы удалить их selections
      const users = await this.getUsersInRoom(roomId)
      const userSelectionKeys = users.map((user) =>
        this.KEYS.userSelections(roomId, user.userId),
      )
      const userInRoomKeys = users.map((user) =>
        this.KEYS.userInRoom(user.userId),
      )

      const keys = [
        this.KEYS.roomState(roomId),
        this.KEYS.roomDraft(roomId),
        this.KEYS.mediaPool(roomId),
        this.KEYS.swipes(roomId),
        this.KEYS.users(roomId),
        this.KEYS.userInRoom(userId),
        ...userSelectionKeys,
        ...userInRoomKeys,
      ]

      await this.redis.del(...keys)
      this.logger.log(`Deleted ${keys.length} keys for room ${roomId}`)
    } catch (error) {
      this.logger.error(
        `Failed to delete room data: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Получить объединённый draft всех пользователей комнаты
   */
  async getRoomDraft(roomId: string): Promise<string[]> {
    try {
      const users = await this.getUsersInRoom(roomId)
      const allSelections = await Promise.all(
        users.map((user) => this.getUserSelections(roomId, user.userId)),
      )
      // Объединяем и убираем дубликаты
      const uniqueSelections = [...new Set(allSelections.flat())]
      return uniqueSelections
    } catch (error) {
      this.logger.error(
        `Failed to get room draft: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Продлить TTL всех ключей комнаты
   */
  async refreshRoomTTL(roomId: string): Promise<void> {
    try {
      const users = await this.getUsersInRoom(roomId)
      const userSelectionKeys = users.map((user) =>
        this.KEYS.userSelections(roomId, user.userId),
      )

      const keys = [
        this.KEYS.roomState(roomId),
        this.KEYS.mediaPool(roomId),
        this.KEYS.swipes(roomId),
        this.KEYS.users(roomId),
        ...userSelectionKeys,
      ]

      await Promise.all(
        keys.map((key) => this.redis.expire(key, this.ROOM_TTL)),
      )
    } catch (error) {
      this.logger.error(
        `Failed to refresh room TTL: ${error.message}`,
        error.stack,
      )
      // Не бросаем ошибку - это не критично
    }
  }

  /**
   * Проверить существует ли комната
   */
  async roomExists(roomId: string): Promise<boolean> {
    const key = this.KEYS.roomState(roomId)

    try {
      const exists = await this.redis.exists(key)
      return exists > 0
    } catch (error) {
      this.logger.error(
        `Failed to check room existence: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }
}
