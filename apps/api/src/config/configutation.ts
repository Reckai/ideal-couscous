// apps/api/src/config/configuration.ts

import { validateEnvironment } from './validation.schema';

/**
 * Configuration factory
 * Валидирует и трансформирует environment variables
 */
export default () => {
  // Валидация при загрузке конфига
  const env = validateEnvironment(process.env);

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,

    // Redis
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined, // Empty string → undefined
      db: env.REDIS_DB,
    },

    // Database
    database: {
      url: env.DATABASE_URL,
    },

    // Session
    session: {
      secret: env.SESSION_SECRET,
      ttl: env.SESSION_TTL,
    },

    // CORS
    cors: {
      origin: env.CORS_ORIGIN,
    },

    // Rate limiting
    rateLimit: {
      ttl: env.RATE_LIMIT_TTL,
      max: env.RATE_LIMIT_MAX,
    },
  };
};
