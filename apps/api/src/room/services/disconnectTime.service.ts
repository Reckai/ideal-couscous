import { Injectable } from '@nestjs/common'

@Injectable()
export class DisconnectTimerService {
  private timers = new Map<string, NodeJS.Timeout>()
  setTimer(socketId: string, callback: () => void) {
    const timer = setTimeout(() => {
      callback()
    }, 30000)
    this.timers.set(socketId, timer)
  }

  clearTimer(socketId: string) {
    const timer = this.timers.get(socketId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(socketId)
    }
  }
}
