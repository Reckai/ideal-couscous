import type { User } from 'generated/prisma'
import { Injectable, NotFoundException } from '@nestjs/common'
import { AbstractUserRepository, AbstractUserService } from './interfaces'

/**
 * UserService - business logic for user management
 * MVP v1: anonymous user management
 * v2: add registration, login, profiles
 */
@Injectable()
export class UserService extends AbstractUserService {
  constructor(private readonly userRepository: AbstractUserRepository) {
    super()
  }

  /**
   * Create an anonymous user
   * Used on the first visit to the site
   *
   * @returns Created user
   */
  async createAnonymousUser(): Promise<User> {
    return this.userRepository.createAnonymous()
  }

  /**
   * Get a user by ID with existence validation
   *
   * @param userId - user UUID
   * @returns User
   * @throws NotFoundException if the user is not found
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`)
    }

    return user
  }

  /**
   * Check if a user exists
   * Used in Guard for cookie validation
   *
   * @param userId - user UUID
   * @returns true if the user exists
   */
  async userExists(userId: string): Promise<boolean> {
    return this.userRepository.exists(userId)
  }

  /**
   * Get or create a user
   * If userId is provided and exists - return it
   * If not - create a new anonymous user
   *
   * @param userId - optional UUID from cookie
   * @returns Existing or new user
   */
  async getOrCreateUser(userId?: string): Promise<User> {
    // If userId is provided, try to find the user
    if (userId) {
      const user = await this.userRepository.findById(userId)
      if (user) {
        return user
      }
    }

    // If not found or not provided - create a new one
    return this.createAnonymousUser()
  }

  /**
   * Delete an anonymous user
   * For cleanup of old inactive users
   *
   * @param userId - user UUID
   */
  async deleteUser(userId: string): Promise<void> {
    await this.getUserById(userId) // Verify existence
    await this.userRepository.delete(userId)
  }
}
