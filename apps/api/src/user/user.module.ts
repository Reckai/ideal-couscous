import { Module } from '@nestjs/common'
import { AbstractUserRepository, AbstractUserService } from './interfaces'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'

/**
 * UserModule - user management module
 * Global module for access from any application module
 *
 * Exports:
 * - AbstractUserService: for working with users in other modules
 * - AbstractUserRepository: for direct data access (if needed)
 */
@Module({
  providers: [
    { provide: AbstractUserService, useClass: UserService },
    { provide: AbstractUserRepository, useClass: UserRepository },
  ],
  exports: [AbstractUserService, AbstractUserRepository],
})
export class UserModule {}
