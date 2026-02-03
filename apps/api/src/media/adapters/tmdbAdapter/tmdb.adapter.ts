import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { MediaEntityDTO } from 'src/media/dto/media.dto'

interface TmdbRawMedia { id: number, poster_path: string | null, title: string }
interface TmdbRawResponse {
  data: {
    results: Array<TmdbRawMedia>
  }
}

@Injectable()
export class TmdbAdapter {
  private readonly logger = new Logger(TmdbAdapter.name)
  private readonly TMDB_API = 'https://api.themoviedb.org/3'
  private readonly API_KEY: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.API_KEY = this.configService.get<string>('tmdb.apiKey')
  }

  async fetchAndAdaptPage(page: number): Promise<MediaEntityDTO[]> {
    try {
      const url = `${this.TMDB_API}/discover/movie?sort_by=popularity.desc&language=ru-RU&page=${page}`

      const response: TmdbRawResponse = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${this.API_KEY}` },
        }),
      )
      return response.data.results.filter((media) => media.poster_path !== null).map((media) => this.toDomain(media))
    } catch (error) {
      this.logger.error(`Failed to fetch page ${page}: ${error.message}`)
      throw error
    }
  }

  private toDomain(media: TmdbRawMedia): MediaEntityDTO {
    const baseTmdbLink = 'https://www.themoviedb.org/movie/'
    return {
      tmdbId: String(media.id),
      posterPath: media.poster_path,
      TMDBLink: `${baseTmdbLink}${media.id}`,
      title: media.title,
    }
  }
}
