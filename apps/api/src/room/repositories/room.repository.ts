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

  private readonly ROOM_INCLUDE = {
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
  } as const

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new room
   *
   * @param hostId - ID of the user who creates the room
   * @param inviteCode - Unique 6-character code
   * @param expiresAt - When the room expires (usually +30 minutes)
   * @param preferences - Optional media filters
   * @returns Room with host relation
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
        include: this.ROOM_INCLUDE,
      })
    } catch (error) {
      this.logger.error(`Failed to create room: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Find room by ID with full relations
   *
   * @param roomId - Room UUID
   * @returns Room or null if not found
   */
  async findById(roomId: string): Promise<RoomWithRelations | null> {
    try {
      return await this.prisma.room.findUnique({
        where: { id: roomId },
        include: this.ROOM_INCLUDE,
      })
    } catch (error) {
      this.logger.error(
        `Failed to find room by id ${roomId}: ${error.message}`,
      )
      throw error
    }
  }

  /**
   * Find room by invite code
   * Used when a guest is joining
   *
   * @param inviteCode - 6-character code (uppercase)
   * @returns Room or null
   */
  async findByInviteCode(
    inviteCode: string,
  ): Promise<RoomWithRelations | null> {
    try {
      return await this.prisma.room.findUnique({
        where: { inviteCode },
        include: this.ROOM_INCLUDE,
      })
    } catch (error) {
      this.logger.error(`Failed to find room by inviteCode: ${error.message}`)
      throw error
    }
  }
  /**
   * Check if invite code exists
   * For generating unique codes without collisions
   *
   * @param inviteCode - Code to check
   * @returns true if the code is already in use
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
   * Add guest to room
   * Atomic operation: guestId + status = SELECTING
   *
   * @param roomId - Room ID
   * @param guestId - ID of the joining user
   * @returns Updated room
   *
   * @throws PrismaClientKnownRequestError if room is not found
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
        include: this.ROOM_INCLUDE,
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
   * Update room status
   *
   * @param roomId - Room ID
   * @param status - New status
   * @returns Updated room (without relations for performance)
   */

  async updateStatus(roomId: string, status: RoomStatus): Promise<Room> {
    this.logger.debug(`Update room ${roomId} status to: ${status}`)
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
   * Create match for room
   * Atomic transaction: Room.status + RoomMatch.create
   *
   * @param roomId - Room ID
   * @param mediaId - ID of the selected media
   * @returns Room with created match
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
          include: this.ROOM_INCLUDE,
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
   * Delete room (hard delete)
   * Cascade deletes related RoomMatch records
   *
   * @param roomId - Room ID
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
}
