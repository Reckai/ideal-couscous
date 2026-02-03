// apps/api/src/modules/room/repositories/room-cache.repository.ts

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RoomStatus } from 'generated/prisma'
import { REDIS_KEYS } from '../../common/redis-keys'
import { User } from '../../matching/types/user'
import { RedisService } from '../../redis/redis.service'

/**
 * Room state structure in Redis
 */
export interface RoomState {
  status: RoomStatus
  hostReady: boolean
  guestReady: boolean
  currentMediaIndex: number
}

/**
 * Repository for working with Room data in Redis
 */
@Injectable()
export class RoomCacheRepository {
  private readonly logger = new Logger(RoomCacheRepository.name)
  private readonly ROOM_TTL: number

  private readonly KEYS = REDIS_KEYS

  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.ROOM_TTL = this.configService.get<number>('room.ttlMinutes') * 60
  }

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

  async getNameOfUserInRoom(roomId: string, userId: string): Promise<string | null> {
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
   * Get room state
   *
   * @param roomId - Room ID
   * @returns State or null if not found
   */
  async getRoomState(roomId: string): Promise<RoomState | null> {
    const key = this.KEYS.roomState(roomId)

    try {
      // Await the Redis call
      const data = await this.redis.hgetall(key)

      // Check for empty object
      if (!data || Object.keys(data).length === 0) {
        return null
      }

      // Parse strings to appropriate types
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
   * Update room status
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
   * Set user readiness
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
   * Check if both participants are ready
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
   * Save user selection
   */
  async saveUserSelection(roomId: string, userId: string, mediaId: string): Promise<number> {
    const key = this.KEYS.userSelections(roomId, userId)
    this.logger.debug(`Saving ${mediaId} selection for user ${userId} in room ${roomId}`)

    const count = await this.redis.scard(key)
    if (count > 50) {
      throw new Error('Draft limit reached')
    }
    // SADD automatically removes duplicates
    const result = await this.redis.sadd(key, mediaId)

    await this.redis.expire(key, this.ROOM_TTL)
    return result
  }

  /**
   * Remove user selection
   */
  async removeUserSelection(roomId: string, userId: string, mediaId: string): Promise<number> {
    const key = this.KEYS.userSelections(roomId, userId)
    return this.redis.srem(key, mediaId)
  }

  /**
   * Get selections of a specific user
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

      // Clear old pool
      await this.redis.del(key)

      // RPUSH appends to the end of the list
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
   * Get media pool
   */
  async getMediaPool(roomId: string): Promise<string[]> {
    const key = this.KEYS.mediaPool(roomId)

    try {
      return await this.redis.lrange(key, 0, -1) // All elements
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
   * Get media pool size
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
   * Delete all room data
   */
  async deleteRoomData(roomId: string, userId: string): Promise<void> {
    this.logger.debug(`Deleting all Redis data for room ${roomId}`)

    try {
      // First get all users to delete their selections
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
   * Get the combined draft of all room users
   */
  async getRoomDraft(roomId: string, userId: string): Promise<string[]> {
    try {
      const selections = await this.getUserSelections(roomId, userId)
      return selections
    } catch (error) {
      this.logger.error(
        `Failed to get room draft: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Extend TTL for all room keys
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
      // Don't throw the error - this is not critical
    }
  }

  /**
   * Check if room exists
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
