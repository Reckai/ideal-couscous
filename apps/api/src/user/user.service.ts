import type { User } from 'generated/prisma'
import { Injectable, NotFoundException } from '@nestjs/common'
import { UserRepository } from './user.repository'

/**
 * UserService - бизнес-логика для работы с пользователями
 * MVP v1: управление анонимными пользователями
 * v2: добавить регистрацию, логин, профили
 */
@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Создать анонимного пользователя
   * Используется при первом посещении сайта
   *
   * @returns Созданный пользователь
   */
  async createAnonymousUser(): Promise<User> {
    return this.userRepository.createAnonymous()
  }

  /**
   * Получить пользователя по ID с валидацией существования
   *
   * @param userId - UUID пользователя
   * @returns Пользователь
   * @throws NotFoundException если пользователь не найден
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`)
    }

    return user
  }

  /**
   * Проверить существование пользователя
   * Используется в Guard для валидации cookie
   *
   * @param userId - UUID пользователя
   * @returns true если пользователь существует
   */
  async userExists(userId: string): Promise<boolean> {
    return this.userRepository.exists(userId)
  }

  /**
   * Получить или создать пользователя
   * Если userId передан и существует - вернуть его
   * Если нет - создать нового анонимного
   *
   * @param userId - опциональный UUID из cookie
   * @returns Существующий или новый пользователь
   */
  async getOrCreateUser(userId?: string): Promise<User> {
    // Если userId передан, пытаемся найти пользователя
    if (userId) {
      const user = await this.userRepository.findById(userId)
      if (user) {
        return user
      }
    }

    // Если не нашли или не был передан - создаем нового
    return this.createAnonymousUser()
  }

  /**
   * Удалить анонимного пользователя
   * Для cleanup старых неактивных пользователей
   *
   * @param userId - UUID пользователя
   */
  async deleteUser(userId: string): Promise<void> {
    await this.getUserById(userId) // Проверяем существование
    await this.userRepository.delete(userId)
  }
}
