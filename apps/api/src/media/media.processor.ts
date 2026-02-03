import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { TmdbAdapter } from './adapters/tmdbAdapter/tmdb.adapter'
import { MediaEntityDTO } from './dto/media.dto'
import { MediaRepository } from './repositories/media.repository'

interface SyncJobData {
  source: string
  pageId: number
}
interface JobResult { status: string, count: number, reason?: string }

@Processor('anime-sync-queue', {
  concurrency: 10,
  limiter: {
    max: 5, // no more than 5 jobs
    duration: 1000, // per second
  },
})
export class AnimeProcessor extends WorkerHost {
  private logger = new Logger(AnimeProcessor.name)

  constructor(
    private readonly animeAdapter: TmdbAdapter,
    private readonly animeRepository: MediaRepository,
  ) {
    super()
  }

  async process(job: Job<SyncJobData>): Promise<JobResult> {
    const { source, pageId } = job.data
    this.logger.debug(`Start processing job ${job.id}: sync page ${pageId} from ${source}`)

    try {
      const animeList: MediaEntityDTO[] = await this.animeAdapter.fetchAndAdaptPage(pageId)
      if (!animeList || animeList.length === 0)
        return { status: 'skipped', count: 0, reason: 'No data' }
      const affectedRows = await this.animeRepository.bulkUpsert(animeList)
      return { status: 'success', count: affectedRows }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack)
      // Throwing the error will make BullMQ use its retry mechanism (attempts)
      throw error
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.verbose(`Job ${job.id} is active`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.warn(`Job ${job.id} failed. Reason: ${error.message}`)
  }
}
