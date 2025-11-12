import { config } from 'dotenv';

config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log('🚀 Starting application...');
  logger.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Cookie parser for AnonymousUserGuard (MVP v1)
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS (allow credentials for cookies)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger API Documentation (only in development)
  if (process.env.NODE_ENV !== 'production') {
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
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // Сохранять авторизацию между перезагрузками
        tagsSorter: 'alpha', // Сортировка тегов по алфавиту
        operationsSorter: 'alpha', // Сортировка операций по алфавиту
      },
      customSiteTitle: 'Anime Tinder API Docs',
    });

    logger.log(
      '📖 Swagger documentation available at http://localhost:4000/api/docs',
    );
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`✅ Application running on http://localhost:${port}/api`);
  logger.log(`🏥 Health check: http://localhost:${port}/api/health`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start:', err);
  process.exit(1);
});
