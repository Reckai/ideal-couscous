import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import { config } from 'dotenv'
import { AppModule } from './app.module'
import { RedisIoAdapter } from './common/adapters/redis.adapter'
import { HttpExceptionFilter } from './core/filters/http-exception.filter'
import { LoggingInterceptor } from './core/interceptors/logging.interceptor'
import { TransformInterceptor } from './core/interceptors/transform.interceptor'

config()

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  logger.log('🚀 Starting application...')
  logger.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  })

  const redisIoAdapter = new RedisIoAdapter(app)
  await redisIoAdapter.connectToRedis()
  app.useWebSocketAdapter(redisIoAdapter)

  // Cookie parser for AnonymousUserGuard (MVP v1)
  app.use(cookieParser())

  // Global prefix
  app.setGlobalPrefix('api')

  // Global filters and interceptors
  const httpAdapterHost = app.get(HttpAdapterHost)
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost))
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor())

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // CORS (allow credentials for cookies)
  const configService = app.get(ConfigService)
  const frontendUrl = configService.get<string>('frontendUrl')
  const port = configService.get<number>('port')
  const nodeEnv = configService.get<string>('nodeEnv')

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  })

  // Swagger API Documentation (only in development)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Anime Tinder API')
      .setDescription(
        'REST API для Anime Tinder - приложения для совместного выбора аниме',
      )
      .setVersion('1.0')
      .addTag('rooms', 'Управление комнатами')
      .addTag('media', 'Каталог медиа контента')
      .addCookieAuth('anonymousUserId', {
        type: 'apiKey',
        in: 'cookie',
        description: 'Cookie с ID анонимного пользователя',
      })
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // Сохранять авторизацию между перезагрузками
        tagsSorter: 'alpha', // Сортировка тегов по алфавиту
        operationsSorter: 'alpha', // Сортировка операций по алфавиту
      },
      customSiteTitle: 'Anime Tinder API Docs',
    })

    logger.log(
      `📖 Swagger documentation available at http://localhost:${port}/api/docs`,
    )
  }

  await app.listen(port)

  logger.log(`✅ Application running on http://localhost:${port}/api`)
  logger.log(`🏥 Health check: http://localhost:${port}/api/health`)
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start:', err)
  process.exit(1)
})
