import type { TestingModule } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { Test } from '@nestjs/testing'
import { Prisma, RoomStatus } from 'generated/prisma'
import { PrismaService } from '../../Prisma/prisma.service'
import { RoomRepository } from './room.repository'

// Мок PrismaService
const mockPrismaService = {
  room: {
    create: jest.fn(),
    findUnique: jest.fn(),
    // ... здесь можно добавить моки для других методов по мере необходимости
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

    // Очищаем моки перед каждым тестом
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(repository).toBeDefined()
  })

  // ============================================================================
  // ТЕСТ ДЛЯ МЕТОДА create
  // ============================================================================
  describe('create', () => {
    it('should create a new room with correct data', async () => {
      // 1. Подготовка данных
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

      // 2. Настройка мока
      // Говорим, что при вызове prisma.room.create должен вернуться наш mockRoom
      mockPrismaService.room.create.mockResolvedValue(mockRoom)

      // 3. Вызов тестируемого метода
      const result = await repository.create(hostId, inviteCode, expiresAt)

      // 4. Проверка результатов (Asserts)
      // Проверяем, что метод prisma.room.create был вызван один раз
      expect(prisma.room.create).toHaveBeenCalledTimes(1)

      // Проверяем, что метод prisma.room.create был вызван с правильными аргументами
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: {
          hostId,
          inviteCode,
          expiresAt,
          preferences: Prisma.JsonNull, // Prisma.JsonNull заменяется на null в моке
          status: RoomStatus.WAITING,
        },
        // Проверяем, что include параметры тоже переданы верно
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

      // Проверяем, что метод вернул тот результат, который мы ожидали
      expect(result).toEqual(mockRoom)
    })
  })

  describe('find by id', () => {
    it('should find a room with correct data', async () => {
      // 1. Подготовка данных
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

      // 2. Настройка мока
      // Говорим, что при вызове prisma.room.findUnique должен вернуться наш mockRoom
      mockPrismaService.room.findUnique.mockResolvedValue(mockRoom)

      // 3. Вызов тестируемого метода
      const result = await repository.findById(id)

      // 4. Проверки
      expect(prisma.room.findUnique).toHaveBeenCalledTimes(1)

      // Проверяем, что метод prisma.room.create был вызван с правильными аргументами
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id },
        // Проверяем, что include параметры тоже переданы верно
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

      // Проверяем, что метод вернул тот результат, который мы ожидали
      expect(result).toEqual(mockRoom)
    })
  })
  describe('find by Invite code', () => {
    it('should find a room with correct data with invite code', async () => {
      // 1. Подготовка данных
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

      // 4. Проверки
      expect(prisma.room.findUnique).toHaveBeenCalledTimes(1)

      // Проверяем, что метод prisma.room.create был вызван с правильными аргументами
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { inviteCode },
        // Проверяем, что include параметры тоже переданы верно
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

      // Проверяем, что метод вернул тот результат, который мы ожидали
      expect(result).toEqual(mockRoom)
    })
  })
})
