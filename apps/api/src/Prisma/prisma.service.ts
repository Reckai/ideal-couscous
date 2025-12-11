import type {
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import {
  Injectable,
  Logger,
} from '@nestjs/common'
import { PrismaClient } from 'generated/prisma'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'colorless',
    })

    // Логирование запросов в development режиме
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`)
        this.logger.debug(`Duration: ${e.duration}ms`)
      })
    }

    this.$on('error' as never, (e: any) => {
      this.logger.error(e)
    })
  }

  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('Successfully connected to database')
    } catch (error) {
      this.logger.error('Failed to connect to database', error)
      throw error
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Disconnected from database')
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!')
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => key[0] !== '_' && key[0] !== '$',
    )

    return Promise.all(
      models.map((modelKey) => (this as any)[modelKey].deleteMany()),
    )
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}
