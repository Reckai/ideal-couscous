// apps/api/src/config/validation.schema.ts

import { z } from 'zod';

/**
 * Zod schema для валидации environment variables
 *
 * Преимущества перед Joi:
 * - Лучшая интеграция с TypeScript
 * - Автоматический type inference
 * - Меньший размер бандла
 * - Более читаемый синтаксис
 */
export const environmentSchema = z.object({
  // Node
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'staging'])
    .default('development'),

  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .default(4000),

  // Redis
  REDIS_HOST: z.string().min(1, 'REDIS_HOST is required').default('localhost'),

  REDIS_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(65535))
    .default(6379),

  REDIS_PASSWORD: z.string().optional().default(''),

  REDIS_DB: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0).max(15))
    .default(0),

  // PostgreSQL
  DATABASE_URL: z
    .url('DATABASE_URL must be a valid URL')
    .startsWith(
      'postgresql://',
      'DATABASE_URL must be a PostgreSQL connection string',
    )
    .min(1, 'DATABASE_URL is required'),

  // Session
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters for security')
    .regex(
      /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
      'SESSION_SECRET contains invalid characters',
    ),

  SESSION_TTL: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .default(2592000), // 30 дней

  // Optional: CORS
  CORS_ORIGIN: z.string().url().optional().default('http://localhost:3001'),

  // Optional: Rate limiting
  RATE_LIMIT_TTL: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .default(60), // 60 секунд

  RATE_LIMIT_MAX: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .default(100), // 100 requests
});

/**
 * Инферим TypeScript тип из Zod schema
 * Используем для type-safe доступа к config
 */
export type Environment = z.infer<typeof environmentSchema>;

/**
 * Функция валидации environment variables
 * Вызывается при старте приложения
 *
 * @param config - process.env object
 * @returns Валидированный и типизированный config
 * @throws ZodError если validation failed
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  const result = environmentSchema.safeParse(config);

  if (!result.success) {
    // Красивое форматирование ошибок
    const errors = result.error.issues.map((issue) => {
      return `${issue.path.join('.')}: ${issue.message}`;
    });

    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  return result.data;
}
