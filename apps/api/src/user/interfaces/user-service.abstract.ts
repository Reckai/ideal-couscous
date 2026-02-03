import type { User } from 'generated/prisma'

export abstract class AbstractUserService {
  abstract createAnonymousUser(): Promise<User>
  abstract getUserById(userId: string): Promise<User>
  abstract userExists(userId: string): Promise<boolean>
  abstract getOrCreateUser(userId?: string): Promise<User>
  abstract deleteUser(userId: string): Promise<void>
}
