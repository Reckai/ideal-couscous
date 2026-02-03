import type { ExecutionContext } from '@nestjs/common'
import type { User } from 'generated/prisma'
import { createParamDecorator } from '@nestjs/common'

/**
 * CurrentUser - decorator for extracting the current user from request
 *
 * Usage:
 * @CurrentUser() user: User - get the entire user object
 * @CurrentUser('id') userId: string - get only the ID
 * @CurrentUser('name') userName: string - get only the name
 *
 * Requirements:
 * - AnonymousUserGuard (or another guard that sets request.user) must be applied
 *
 * Examples:
 * ```typescript
 * @UseGuards(AnonymousUserGuard)
 * @Post()
 * createRoom(@CurrentUser('id') userId: string) {
 *   return this.roomService.createRoom(userId);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (property: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as User

    if (!user) {
      throw new Error(
        'CurrentUser decorator requires AnonymousUserGuard or AuthGuard to be applied',
      )
    }

    // If a property name is provided, return only that property
    if (property) {
      return user[property]
    }

    // Otherwise return the entire user object
    return user
  },
)
