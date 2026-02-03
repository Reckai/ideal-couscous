import { validateEnvironment } from './validation.schema'

export default () => {
  const env = validateEnvironment(process.env)

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,

    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
    },

    database: {
      url: env.DATABASE_URL,
    },

    session: {
      secret: env.SESSION_SECRET,
      ttlDays: env.SESSION_TTL_DAYS,
    },

    room: {
      ttlMinutes: env.ROOM_TTL_MINUTES,
    },

    tmdb: {
      apiKey: env.TMDB_API_KEY,
    },

    frontendUrl: env.FRONTEND_URL,
  }
}
