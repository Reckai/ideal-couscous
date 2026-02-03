import type {
  CanActivate,
  ExecutionContext,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import {
  Injectable,
  Logger,
} from '@nestjs/common'
import { UserService } from '../../user'

/**
 * Cookie для хранения ID анонимного пользователя
 * Expires: 30 дней
 * HttpOnly: защита от XSS
 * SameSite: защита от CSRF
 */
const ANONYMOUS_USER_COOKIE = 'anonymousUserId'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 дней в миллисекундах

/**
 * AnonymousUserGuard - автоматическое создание/восстановление анонимных пользователей
 *
 * Логика работы:
 * 1. Проверяет наличие cookie с userId
 * 2. Если cookie есть → валидирует существование пользователя в БД
 * 3. Если пользователь найден → добавляет его в request.user
 * 4. Если нет → создает нового анонимного пользователя
 * 5. Устанавливает/обновляет cookie
 *
 * MVP v1: только анонимные пользователи
 * v2: добавить проверку JWT для зарегистрированных пользователей
 */
@Injectable()
export class AnonymousUserGuard implements CanActivate {
  private readonly logger = new Logger(AnonymousUserGuard.name)

  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Only apply to HTTP requests (skip WebSocket)
    if (context.getType() !== 'http') {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()

    // Получаем userId из cookie
    const cookieUserId = request.cookies?.[ANONYMOUS_USER_COOKIE] as
      | string
      | undefined

    let user

    if (cookieUserId) {
      this.logger.debug(`Found cookie userId: ${cookieUserId}`)

      // Пытаемся получить или создать пользователя
      user = await this.userService.getOrCreateUser(cookieUserId)

      // Если вернулся другой пользователь (cookie был невалидный), логируем
      if (user.id !== cookieUserId) {
        this.logger.warn(
          `Cookie userId ${cookieUserId} not found, created new user ${user.id}`,
        )
      }
    } else {
      this.logger.debug('No cookie found, creating new anonymous user')
      // Создаем нового анонимного пользователя
      user = await this.userService.createAnonymousUser()
    }

    // Сохраняем пользователя в request для доступа через декоратор
    request['user'] = user

    // Устанавливаем/обновляем cookie
    response.cookie(ANONYMOUS_USER_COOKIE, user.id, {
      httpOnly: true, // Защита от XSS
      secure: process.env.NODE_ENV === 'production', // HTTPS only в production
      sameSite: 'lax', // Защита от CSRF
      maxAge: COOKIE_MAX_AGE,
      path: '/', // Доступен для всего сайта
    })

    this.logger.debug(`User authenticated: ${user.id} (${user.name})`)

    return true
  }
}
