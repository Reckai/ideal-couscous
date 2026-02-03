import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Queue } from 'bullmq'

@Injectable()
export class AnimeScheduler {
  constructor(@InjectQueue('anime-sync-queue') private queue: Queue) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    for (let page = 1; page <= 50; page++) {
      await this.queue.add('process-page', {
        pageId: page,
        source: 'tmdb',
      }, {
        removeOnComplete: true,
        attempts: 3,
        backoff: 5000,
      })
    }
  }
}
