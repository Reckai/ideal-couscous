import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import { ServerOptions } from 'socket.io'

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>
  private readonly configService: ConfigService

  constructor(app: INestApplication) {
    super(app)
    this.configService = app.get(ConfigService)
  }

  async connectToRedis(): Promise<void> {
    const host = this.configService.get<string>('redis.host', 'localhost')
    const port = this.configService.get<number>('redis.port', 6379)
    const password = this.configService.get<string>('redis.password')

    const pubClient = new Redis({
      host,
      port,
      password,
    })
    const subClient = pubClient.duplicate()
    this.adapterConstructor = createAdapter(pubClient, subClient)
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options)
    server.adapter(this.adapterConstructor)
    return server
  }
}
