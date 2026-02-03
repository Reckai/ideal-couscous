import { Module } from '@nestjs/common'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'

/**
 * UserModule - user management module
 * Global module for access from any application module
 *
 * Exports:
 * - UserService: for working with users in other modules
 * - UserRepository: for direct data access (if needed)
 */
@Module({
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
