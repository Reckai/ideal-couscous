import type { OnModuleDestroy } from '@nestjs/common'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AbstractDisconnectTimerService } from '../interfaces'

@Injectable()
export class DisconnectTimerService extends AbstractDisconnectTimerService implements OnModuleDestroy {
  private readonly logger = new Logger(DisconnectTimerService.name)
  private timers = new Map<string, NodeJS.Timeout>()
  private readonly timeout: number

  constructor(private readonly configService: ConfigService) {
    super()
    this.timeout = (this.configService.get<number>('room.ttlMinutes', 30)) * 60 * 1000
  }

  setTimer(socketId: string, callback: () => void) {
    // Clear existing timer to prevent leak
    this.clearTimer(socketId)

    const timer = setTimeout(async () => {
      try {
        callback()
      } catch (error) {
        this.logger.error(`Error in disconnect timer callback for ${socketId}: ${error.message}`)
      } finally {
        this.timers.delete(socketId)
      }
    }, this.timeout)
    this.timers.set(socketId, timer)
  }

  clearTimer(socketId: string) {
    const timer = this.timers.get(socketId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(socketId)
    }
  }

  onModuleDestroy() {
    for (const [socketId, timer] of this.timers) {
      clearTimeout(timer)
      this.logger.debug(`Cleared timer for ${socketId} on shutdown`)
    }
    this.timers.clear()
  }
}
