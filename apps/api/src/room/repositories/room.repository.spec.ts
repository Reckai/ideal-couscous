import type { TestingModule } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { Test } from '@nestjs/testing'
import { Prisma, RoomStatus } from 'generated/prisma'
import { PrismaService } from '../../Prisma/prisma.service'
import { RoomRepository } from './room.repository'

// Mock PrismaService
const mockPrismaService = {
  room: {
    create: jest.fn(),
    findUnique: jest.fn(),
    // ... add mocks for other methods as needed
  },
}

describe('roomRepository', () => {
  let repository: RoomRepository
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    repository = module.get<RoomRepository>(RoomRepository)
    prisma = module.get<PrismaService>(PrismaService)

    // Clear mocks before each test
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(repository).toBeDefined()
  })

  // ============================================================================
  // TEST FOR create METHOD
  // ============================================================================
  describe('create', () => {
    it('should create a new room with correct data', async () => {
      // 1. Prepare data
      const hostId = randomUUID()
      const inviteCode = 'ABCDEF'
      const expiresAt = new Date()
      const mockRoom = {
        id: randomUUID(),
        hostId,
        inviteCode,
        expiresAt,
        status: RoomStatus.WAITING,
        guestId: null,
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        match: null,
        host: { id: hostId, name: 'Test Host' },
        guest: null,
      }

      // 2. Configure mock
      mockPrismaService.room.create.mockResolvedValue(mockRoom)

      // 3. Call the method under test
      const result = await repository.create(hostId, inviteCode, expiresAt)

      // 4. Assertions
      expect(prisma.room.create).toHaveBeenCalledTimes(1)

      // Verify prisma.room.create was called with correct arguments
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: {
          hostId,
          inviteCode,
          expiresAt,
          preferences: Prisma.JsonNull,
          status: RoomStatus.WAITING,
        },
        // Verify include parameters are also correct
        include: {
          host: { select: { id: true, name: true } },
          guest: { select: { id: true, name: true } },
          match: {
            include: {
              media: {
                select: {
                  id: true,
                  tmdbId: true,
                  title: true,
                  posterPath: true,
                },
              },
            },
          },
        },
      })

      // Verify the method returned the expected result
      expect(result).toEqual(mockRoom)
    })
  })

  describe('find by id', () => {
    it('should find a room with correct data', async () => {
      // 1. Prepare data
      const hostId = randomUUID()
      const inviteCode = 'ABCDEF'
      const expiresAt = new Date()
      const id = randomUUID()
      const mockRoom = {
        id,
        hostId,
        inviteCode,
        expiresAt,
        status: RoomStatus.WAITING,
        guestId: null,
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        match: null,
        host: { id: hostId, name: 'Test Host' },
        guest: null,
      }

      // 2. Configure mock
      mockPrismaService.room.findUnique.mockResolvedValue(mockRoom)

      // 3. Call the method under test
      const result = await repository.findById(id)

      // 4. Assertions
      expect(prisma.room.findUnique).toHaveBeenCalledTimes(1)

      // Verify prisma.room.findUnique was called with correct arguments
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id },
        // Verify include parameters are also correct
        include: {
          host: { select: { id: true, name: true } },
          guest: { select: { id: true, name: true } },
          match: {
            include: {
              media: {
                select: {
                  id: true,
                  tmdbId: true,
                  title: true,
                  posterPath: true,
                },
              },
            },
          },
        },
      })

      // Verify the method returned the expected result
      expect(result).toEqual(mockRoom)
    })
  })
  describe('find by Invite code', () => {
    it('should find a room with correct data with invite code', async () => {
      // 1. Prepare data
      const hostId = randomUUID()
      const inviteCode = 'ABCDEF'
      const expiresAt = new Date()
      const id = randomUUID()
      const mockRoom = {
        id,
        hostId,
        inviteCode,
        expiresAt,
        status: RoomStatus.WAITING,
        guestId: null,
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        match: null,
        host: { id: hostId, name: 'Test Host' },
        guest: null,
      }

      mockPrismaService.room.findUnique.mockResolvedValue(mockRoom)

      const result = await repository.findByInviteCode(inviteCode)

      // 4. Assertions
      expect(prisma.room.findUnique).toHaveBeenCalledTimes(1)

      // Verify prisma.room.findUnique was called with correct arguments
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { inviteCode },
        // Verify include parameters are also correct
        include: {
          host: { select: { id: true, name: true } },
          guest: { select: { id: true, name: true } },
          match: {
            include: {
              media: {
                select: {
                  id: true,
                  tmdbId: true,
                  title: true,
                  posterPath: true,
                },
              },
            },
          },
        },
      })

      // Verify the method returned the expected result
      expect(result).toEqual(mockRoom)
    })
  })
})
