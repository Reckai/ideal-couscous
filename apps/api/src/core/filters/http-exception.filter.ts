import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      return
    }

    const { httpAdapter } = this.httpAdapterHost
    const ctx = host.switchToHttp()

    const httpStatus
      = exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message
      = exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error'

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message:
        typeof message === 'object' && 'message' in (message as object)
          ? (message as Record<string, unknown>).message
          : message,
    }

    if (httpStatus >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${httpAdapter.getRequestMethod(ctx.getRequest())} ${httpAdapter.getRequestUrl(ctx.getRequest())} ${httpStatus}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus)
  }
}
