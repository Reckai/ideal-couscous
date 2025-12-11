import type { User } from 'generated/prisma'
import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../Prisma/prisma.service'

/**
 * UserRepository - работа с пользователями в PostgreSQL
 * MVP v1: поддержка только анонимных пользователей
 * v2: добавить методы для регистрации/логина
 */
@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать анонимного пользователя
   * Генерируется случайное имя типа "Guest_AB12CD"
   *
   * @param name - опциональное имя (если не передано, генерируется автоматически)
   * @returns Созданный пользователь
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
   * Найти пользователя по ID
   *
   * @param userId - UUID пользователя
   * @returns Пользователь или null
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
   * Проверить существование пользователя
   *
   * @param userId - UUID пользователя
   * @returns true если пользователь существует
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
   * Удалить пользователя (для cleanup)
   *
   * @param userId - UUID пользователя
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
  // ПРИВАТНЫЕ МЕТОДЫ
  // ============================================================================

  /**
   * Генерирует случайное имя гостя формата "Guest_XXXXXX"
   * Использует base36 для компактности (6 символов = ~2 млрд комбинаций)
   */
  private generateGuestName(): string {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `Guest_${randomPart}`
  }
}
