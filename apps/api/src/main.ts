import { config } from 'dotenv';

config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log('🚀 Starting application...');
  logger.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

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

  // CORS
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`✅ Application running on http://localhost:${port}/api`);
  logger.log(`🏥 Health check: http://localhost:${port}/api/health`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start:', err);
  process.exit(1);
});
