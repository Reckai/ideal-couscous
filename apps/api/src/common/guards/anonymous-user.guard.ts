import type {
  CanActivate,
  ExecutionContext,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import {
  Injectable,
  Logger,
} from '@nestjs/common'
import { AbstractUserService } from '../../user/interfaces'

/**
 * Cookie for storing the anonymous user ID
 * Expires: 30 days
 * HttpOnly: XSS protection
 * SameSite: CSRF protection
 */
const ANONYMOUS_USER_COOKIE = 'anonymousUserId'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

/**
 * AnonymousUserGuard - automatic creation/restoration of anonymous users
 *
 * How it works:
 * 1. Checks for cookie with userId
 * 2. If cookie exists -> validates user existence in DB
 * 3. If user found -> adds them to request.user
 * 4. If not -> creates a new anonymous user
 * 5. Sets/updates cookie
 *
 * MVP v1: anonymous users only
 * v2: add JWT verification for registered users
 */
@Injectable()
export class AnonymousUserGuard implements CanActivate {
  private readonly logger = new Logger(AnonymousUserGuard.name)

  constructor(private readonly userService: AbstractUserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Only apply to HTTP requests (skip WebSocket)
    if (context.getType() !== 'http') {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()

    // Get userId from cookie
    const cookieUserId = request.cookies?.[ANONYMOUS_USER_COOKIE] as
      | string
      | undefined

    let user

    if (cookieUserId) {
      this.logger.debug(`Found cookie userId: ${cookieUserId}`)

      // Try to get or create user
      user = await this.userService.getOrCreateUser(cookieUserId)

      // If a different user was returned (cookie was invalid), log it
      if (user.id !== cookieUserId) {
        this.logger.warn(
          `Cookie userId ${cookieUserId} not found, created new user ${user.id}`,
        )
      }
    } else {
      this.logger.debug('No cookie found, creating new anonymous user')
      // Create a new anonymous user
      user = await this.userService.createAnonymousUser()
    }

    // Save user to request for access via decorator
    request['user'] = user

    // Set/update cookie
    response.cookie(ANONYMOUS_USER_COOKIE, user.id, {
      httpOnly: true, // XSS protection
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: COOKIE_MAX_AGE,
      path: '/', // Available for the entire site
    })

    this.logger.debug(`User authenticated: ${user.id} (${user.name})`)

    return true
  }
}
