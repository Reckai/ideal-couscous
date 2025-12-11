import type { ExecutionContext } from '@nestjs/common'
import type { User } from 'generated/prisma'
import { createParamDecorator } from '@nestjs/common'

/**
 * CurrentUser - декоратор для извлечения текущего пользователя из request
 *
 * Использование:
 * @CurrentUser() user: User - получить весь объект пользователя
 * @CurrentUser('id') userId: string - получить только ID
 * @CurrentUser('name') userName: string - получить только имя
 *
 * Требования:
 * - Должен быть применен AnonymousUserGuard (или другой guard, устанавливающий request.user)
 *
 * Примеры:
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

    // Если передано имя свойства, возвращаем только его
    if (property) {
      return user[property]
    }

    // Иначе возвращаем весь объект пользователя
    return user
  },
)
