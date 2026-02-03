import type { User } from 'generated/prisma'

export abstract class AbstractUserRepository {
  abstract createAnonymous(name?: string): Promise<User>
  abstract findById(userId: string): Promise<User | null>
  abstract exists(userId: string): Promise<boolean>
  abstract delete(userId: string): Promise<void>
}
