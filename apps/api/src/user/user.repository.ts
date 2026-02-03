import type { User } from 'generated/prisma'
import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../Prisma/prisma.service'

/**
 * UserRepository - user operations in PostgreSQL
 * MVP v1: anonymous users only
 * v2: add methods for registration/login
 */
@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an anonymous user
   * Generates a random name like "Guest_AB12CD"
   *
   * @param name - optional name (if not provided, generated automatically)
   * @returns Created user
   */
  async createAnonymous(name?: string): Promise<User> {
    const userName = name || this.generateGuestName()

    this.logger.debug(`Creating anonymous user: ${userName}`)

    try {
      return await this.prisma.user.create({
        data: {
          name: userName,
          isAnonymous: true,
        },
      })
    } catch (error) {
      this.logger.error(
        `Failed to create anonymous user: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Find a user by ID
   *
   * @param userId - user UUID
   * @returns User or null
   */
  async findById(userId: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId },
      })
    } catch (error) {
      this.logger.error(
        `Failed to find user by id ${userId}: ${error.message}`,
      )
      throw error
    }
  }

  /**
   * Check if a user exists
   *
   * @param userId - user UUID
   * @returns true if the user exists
   */
  async exists(userId: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { id: userId },
      })
      return count > 0
    } catch (error) {
      this.logger.error(
        `Failed to check user existence ${userId}: ${error.message}`,
      )
      throw error
    }
  }

  /**
   * Delete a user (for cleanup)
   *
   * @param userId - user UUID
   */
  async delete(userId: string): Promise<void> {
    this.logger.debug(`Deleting user ${userId}`)

    try {
      await this.prisma.user.delete({
        where: { id: userId },
      })
    } catch (error) {
      this.logger.error(
        `Failed to delete user ${userId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Generates a random guest name in the format "Guest_XXXXXX"
   * Uses base36 for compactness (6 characters = ~2 billion combinations)
   */
  private generateGuestName(): string {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `Guest_${randomPart}`
  }
}
