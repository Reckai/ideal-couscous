import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient()
    const userId = client.data?.userId

    if (!userId) {
      throw new WsException({
        message: 'User is not authenticated',
        code: 'UNAUTHENTICATED',
      })
    }

    return true
  }
}
