import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common'
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets'

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient()
    const pattern = host.switchToWs().getPattern()

    const status = 'error'
    let message = 'Internal server error'
    let code = 'INTERNAL_ERROR'

    if (exception instanceof WsException) {
      const error = exception.getError()
      if (typeof error === 'object' && error !== null) {
        message = (error as Record<string, string>).message || message
        code = (error as Record<string, string>).code || code
      } else {
        message = String(error)
      }
    } else if (exception instanceof HttpException) {
      const response = exception.getResponse()
      message
        = typeof response === 'object' && 'message' in (response as object)
          ? String((response as Record<string, unknown>).message)
          : String(response)
      code = `HTTP_${exception.getStatus()}`
    } else if (exception instanceof Error) {
      message = exception.message
    }

    this.logger.error(
      `[WS] Event: ${pattern} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    )

    client.emit('exception', {
      status,
      event: pattern,
      message,
      code,
    })
  }
}
