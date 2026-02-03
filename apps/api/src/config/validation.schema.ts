// apps/api/src/config/validation.schema.ts

import { z } from 'zod'

/**
 * Zod schema для валидации environment variables
 */
export const environmentSchema = z.object({
  // Node
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().int().positive())
    .default(3001),

  // PostgreSQL
  DATABASE_URL: z
    .string()
    .startsWith(
      'postgresql://',
      'DATABASE_URL must be a PostgreSQL connection string',
    )
    .min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_HOST: z.string().min(1).default('localhost'),

  REDIS_PORT: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().int().min(1).max(65535))
    .default(6379),

  REDIS_PASSWORD: z.string().optional(),

  // Session
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters'),

  SESSION_TTL_DAYS: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().int().positive())
    .default(30),

  // Room
  ROOM_TTL_MINUTES: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().int().positive())
    .default(30),

  // TMDB
  TMDB_API_KEY: z.string().min(1, 'TMDB_API_KEY is required'),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
})

/**
 * Инферим TypeScript тип из Zod schema
 */
export type Environment = z.infer<typeof environmentSchema>

/**
 * Функция валидации environment variables
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  const result = environmentSchema.safeParse(config)

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      return `${issue.path.join('.')}: ${issue.message}`
    })

    throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
  }

  return result.data
}
