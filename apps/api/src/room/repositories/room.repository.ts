import type { Room } from 'generated/prisma'
import { Injectable, Logger } from '@nestjs/common'
import { $Enums, Prisma } from 'generated/prisma'
import { PrismaService } from '../../Prisma/prisma.service'
import RoomStatus = $Enums.RoomStatus

export type RoomWithRelations = Prisma.RoomGetPayload<{
  include: {
    host: {
      select: {
        id: true
        name: true
      }
    }
    guest: {
      select: {
        id: true
        name: true
      }
    }
    match: {
      include: {
        media: {
          select: {
            id: true
            tmdbId: true
            title: true
            posterPath: true
          }
        }
      }
    }
  }
}>

export type RoomBasic = Pick<
  Room,
  | 'id'
  | 'inviteCode'
  | 'status'
  | 'hostId'
  | 'guestId'
  | 'createdAt'
  | 'expiresAt'
>

@Injectable()
export class RoomRepository {
  private readonly logger = new Logger(RoomRepository.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать новую комнату
   *
   * @param hostId - ID пользователя-создателя
   * @param inviteCode - Уникальный 6-значный код
   * @param expiresAt - Когда комната истекает (обычно +30 минут)
   * @param preferences - Опциональные фильтры для медиа
   * @returns Комната с host relation
   */
  async create(
    hostId: string,
    inviteCode: string,
    expiresAt: Date,
    preferences?: Prisma.JsonValue,
  ): Promise<RoomWithRelations> {
    this.logger.debug(`Creating room with invite code: ${inviteCode}`)
    try {
      return await this.prisma.room.create({
        data: {
          hostId,
          inviteCode,
          expiresAt,
          preferences: preferences ?? Prisma.JsonNull,
          status: RoomStatus.WAITING,
        },
        include: {
          host: {
            select: { id: true, name: true },
          },
          guest: {
            select: { id: true, name: true },
          },
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
    } catch (error) {
      this.logger.error(`Failed to create room: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Найти комнату по ID с полными relations
   *
   * @param roomId - UUID комнаты
   * @returns Комната или null если не найдена
   */
  async findById(roomId: string): Promise<RoomWithRelations | null> {
    try {
      return await this.prisma.room.findUnique({
        where: { id: roomId },
        include: {
          host: {
            select: {
              id: true,
              name: true,
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
            },
          },
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
    } catch (error) {
      this.logger.error(
        `Failed to find room by id ${roomId}: ${error.message}`,
      )
      throw error
    }
  }

  /**
   * Найти комнату по invite code
   * Используется при присоединении guest'а
   *
   * @param inviteCode - 6-значный код (uppercase)
   * @returns Комната или null
   */
  async findByInviteCode(
    inviteCode: string,
  ): Promise<RoomWithRelations | null> {
    try {
      return await this.prisma.room.findUnique({
        where: { inviteCode },
        include: {
          host: {
            select: {
              id: true,
              name: true,
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
            },
          },
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
    } catch (error) {
      this.logger.error(`Failed to find room by inviteCode: ${error.message}`)
      throw error
    }
  }
  /**
   * Проверить существование invite code
   * Для генерации уникальных кодов без коллизий
   *
   * @param inviteCode - Код для проверки
   * @returns true если код уже используется
   */

  async existsByInviteCode(inviteCode: string): Promise<boolean> {
    try {
      const count = await this.prisma.room.count({
        where: {
          inviteCode,
        },
      })
      return count > 0
    } catch (error) {
      this.logger.error(`Failed to find room by inviteCode: ${error.message}`)
      throw error
    }
  }

  /**
   * Добавить guest к комнате
   * Атомарная операция: guestId + status = SELECTING
   *
   * @param roomId - ID комнаты
   * @param guestId - ID присоединяющегося пользователя
   * @returns Обновлённая комната
   *
   * @throws PrismaClientKnownRequestError если комната не найдена
   */
  async addGuest(roomId: string, guestId: string): Promise<RoomWithRelations> {
    this.logger.debug(`Adding guest to room: ${roomId}`)
    try {
      return await this.prisma.room.update({
        where: { id: roomId },
        data: {
          guestId,
          status: RoomStatus.SELECTING,
        },
        include: {
          host: {
            select: {
              id: true,
              name: true,
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
            },
          },
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
    } catch (error) {
      this.logger.error(
        `Failed to add guest to room ${roomId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Обновить статус комнаты
   *
   * @param roomId - ID комнаты
   * @param status - Новый статус
   * @returns Обновлённая комната (без relations для производительности)
   */

  async updateStatus(roomId: string, status: RoomStatus): Promise<Room> {
    this.logger.debug(`Update room  ${roomId} status to: ${status}`)
    try {
      return await this.prisma.room.update({
        where: { id: roomId },
        data: { status },
      })
    } catch (error) {
      this.logger.error(
        `Failed to update room status ${roomId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Создать match для комнаты
   * Атомарная транзакция: Room.status + RoomMatch.create
   *
   * @param roomId - ID комнаты
   * @param mediaId - ID выбранного медиа
   * @returns Комната с созданным match
   */
  async createMatch(
    roomId: string,
    mediaId: string,
  ): Promise<RoomWithRelations> {
    this.logger.log(`Creating match for room ${roomId} with media ${mediaId}`)
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.room.update({
          where: {
            id: roomId,
          },
          data: {
            status: RoomStatus.MATCHED,
          },
        })

        await tx.roomMatch.create({
          data: {
            roomId,
            mediaId,
          },
        })

        return tx.room.findUniqueOrThrow({
          where: { id: roomId },
          include: {
            host: {
              select: {
                id: true,
                name: true,
              },
            },
            guest: {
              select: {
                id: true,
                name: true,
              },
            },
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
      })
    } catch (error) {
      this.logger.error(
        `Failed to create match for room ${roomId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Удалить комнату (hard delete)
   * Cascade удаляет связанные RoomMatch
   *
   * @param roomId - ID комнаты
   */
  async delete(roomId: string): Promise<void> {
    this.logger.debug(`Deleting room ${roomId}`)

    try {
      await this.prisma.room.delete({
        where: { id: roomId },
      })
    } catch (error) {
      this.logger.error(
        `Failed to delete room ${roomId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Найти expired комнаты для cleanup job
   *
   * @param before - Timestamp порога (обычно Date.now())
   * @returns Массив expired комнат
   */
  async findExpired(before: Date): Promise<RoomBasic[]> {
    try {
      return await this.prisma.room.findMany({
        where: {
          expiresAt: { lt: before },
          status: {
            notIn: [
              RoomStatus.MATCHED,
              RoomStatus.EXPIRED,
              RoomStatus.CANCELLED,
            ],
          },
        },
        select: {
          id: true,
          inviteCode: true,
          status: true,
          hostId: true,
          guestId: true,
          createdAt: true,
          expiresAt: true,
        },
      })
    } catch (error) {
      this.logger.error(`Failed to find expired rooms: ${error.message}`)
      throw error
    }
  }

  /**
   * Batch обновление статуса для expired комнат
   *
   * @param roomIds - Массив ID комнат
   * @returns Количество обновлённых записей
   */

  async markAsExpired(roomIds: string[]): Promise<number> {
    if (roomIds.length === 0) {
      return 0
    }
    this.logger.debug(`Marking ${roomIds.length} rooms as expired`)

    try {
      const result = await this.prisma.room.updateMany({
        where: {
          id: { in: roomIds },
        },
        data: {
          status: RoomStatus.EXPIRED,
        },
      })
      this.logger.log(`Marked ${result.count} rooms as expired`)
      return result.count
    } catch (error) {
      this.logger.error(
        `Failed to mark rooms as expired: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }
}
