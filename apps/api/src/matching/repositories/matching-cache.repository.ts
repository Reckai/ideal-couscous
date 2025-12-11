import type { RedisService } from '../../redis/redis.service'
import type { SwipeAction } from '../dto/swipes.dto'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class MatchingCacheRepository {
  private readonly logger = new Logger(MatchingCacheRepository.name)
  private readonly ROOM_TTL = 30 * 60 // 30 минут в секундах
  private readonly KEYS = {
    roomState: (roomId: string) => `room:${roomId}:state`,
    swipes: (roomId: string) => `room:${roomId}:swipes`,
  }

  constructor(private readonly redis: RedisService) {}

  /**
   * Сохранить свайп пользователя
   */
  async saveSwipe(
    roomId: string,
    userId: string,
    mediaId: string,
    action: SwipeAction,
  ): Promise<void> {
    const key = this.KEYS.swipes(roomId)
    const field = `${userId}:${mediaId}`

    try {
      await this.redis.hset(key, field, action)
      await this.redis.expire(key, this.ROOM_TTL)
    } catch (error) {
      this.logger.error(`Failed to save swipe: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Получить свайп пользователя на конкретный медиа
   */
  async getSwipe(
    roomId: string,
    userId: string,
    mediaId: string,
  ): Promise<SwipeAction | null> {
    const key = this.KEYS.swipes(roomId)
    const field = `${userId}:${mediaId}`

    try {
      const value = await this.redis.hget(key, field)
      return value as SwipeAction | null
    } catch (error) {
      this.logger.error(`Failed to get swipe: ${error.message}`, error.stack)
      throw error
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
    hostSwipe: SwipeAction | null
    guestSwipe: SwipeAction | null
  }> {
    const key = this.KEYS.swipes(roomId)

    try {
      const [hostSwipe, guestSwipe] = await Promise.all([
        this.redis.hget(key, `${hostId}:${mediaId}`),
        this.redis.hget(key, `${guestId}:${mediaId}`),
      ])

      return {
        hostSwipe: hostSwipe as SwipeAction | null,
        guestSwipe: guestSwipe as SwipeAction | null,
      }
    } catch (error) {
      this.logger.error(
        `Failed to get swipes for media: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Получить все свайпы комнаты
   */
  async getAllSwipes(roomId: string): Promise<Record<string, string>> {
    const key = this.KEYS.swipes(roomId)

    try {
      return await this.redis.hgetall(key)
    } catch (error) {
      this.logger.error(
        `Failed to get all swipes: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Получить количество свайпов пользователя
   */
  async getUserSwipeCount(roomId: string, userId: string): Promise<number> {
    const allSwipes = await this.getAllSwipes(roomId)
    const userPrefix = `${userId}:`

    return Object.keys(allSwipes).filter((key) => key.startsWith(userPrefix)).length
  }
}
