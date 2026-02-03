export abstract class AbstractDisconnectTimerService {
  abstract setTimer(socketId: string, callback: () => void): void
  abstract clearTimer(socketId: string): void
}
