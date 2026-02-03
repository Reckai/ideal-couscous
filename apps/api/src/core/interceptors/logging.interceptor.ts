import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now()
    const type = context.getType()

    if (type === 'http') {
      const req = context.switchToHttp().getRequest()
      const { method, url } = req

      return next.handle().pipe(
        tap({
          next: () => {
            const res = context.switchToHttp().getResponse()
            const delay = Date.now() - now
            this.logger.log(`[HTTP] ${method} ${url} ${res.statusCode} - ${delay}ms`)
          },
          error: (err: Error) => {
            const delay = Date.now() - now
            this.logger.error(`[HTTP] ${method} ${url} - ${delay}ms - Error: ${err.message}`)
          },
        }),
      )
    } else if (type === 'ws') {
      const handlerName = context.getHandler().name

      return next.handle().pipe(
        tap({
          next: () => {
            const delay = Date.now() - now
            this.logger.log(`[WS] ${handlerName} - ${delay}ms`)
          },
          error: (err: Error) => {
            const delay = Date.now() - now
            this.logger.error(`[WS] ${handlerName} - ${delay}ms - Error: ${err.message}`)
          },
        }),
      )
    }

    return next.handle()
  }
}
