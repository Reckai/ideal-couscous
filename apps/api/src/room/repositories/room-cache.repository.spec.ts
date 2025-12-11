// apps/api/src/modules/room/repositories/room-cache.repository.spec.ts

import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { RoomStatus } from 'generated/prisma'

import { RedisService } from '../../redis/redis.service'
import { RoomCacheRepository } from './room-cache.repository'

describe('roomCacheRepository', () => {
  let repository: RoomCacheRepository
  let redisService: jest.Mocked<RedisService>

  beforeEach(async () => {
    // Mock RedisService
    const mockRedisService = {
      hset: jest.fn(),
      hgetall: jest.fn(),
      hget: jest.fn(),
      expire: jest.fn(),
      sadd: jest.fn(),
      smembers: jest.fn(),
      scard: jest.fn(),
      del: jest.fn(),
      rpush: jest.fn(),
      lrange: jest.fn(),
      llen: jest.fn(),
      exists: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomCacheRepository,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile()

    repository = module.get<RoomCacheRepository>(RoomCacheRepository)
    redisService = module.get(RedisService)
  })

  describe('initRoomState', () => {
    it('should initialize room state with correct values', async () => {
      const roomId = 'test-room-123'
      const status = RoomStatus.WAITING

      await repository.initRoomState(roomId, status)

      expect(redisService.hset).toHaveBeenCalledWith(
        'room:test-room-123:state',
        {
          status: RoomStatus.WAITING,
          hostReady: 'false',
          guestReady: 'false',
          currentMediaIndex: '0',
        },
      )
      expect(redisService.expire).toHaveBeenCalledWith(
        'room:test-room-123:state',
        1800,
      )
    })
  })

  describe('getRoomState', () => {
    it('should return null for empty data', async () => {
      redisService.hgetall.mockResolvedValue({})

      const result = await repository.getRoomState('room-123')

      expect(result).toBeNull()
    })

    it('should parse room state correctly', async () => {
      redisService.hgetall.mockResolvedValue({
        status: RoomStatus.SELECTING,
        hostReady: 'true',
        guestReady: 'false',
        currentMediaIndex: '3',
      })

      const result = await repository.getRoomState('room-123')

      expect(result).toEqual({
        status: RoomStatus.SELECTING,
        hostReady: true,
        guestReady: false,
        currentMediaIndex: 3,
      })
    })
  })

  describe('isMatch', () => {
    it('should return true when both users liked', async () => {
      redisService.hget
        .mockResolvedValueOnce('LIKE') // host
        .mockResolvedValueOnce('LIKE') // guest

      const result = await repository.isMatch(
        'room-123',
        'media-456',
        'host-1',
        'guest-2',
      )

      expect(result).toBe(true)
    })

    it('should return false when one user skipped', async () => {
      redisService.hget
        .mockResolvedValueOnce('LIKE')
        .mockResolvedValueOnce('SKIP')

      const result = await repository.isMatch(
        'room-123',
        'media-456',
        'host-1',
        'guest-2',
      )

      expect(result).toBe(false)
    })
  })
})
