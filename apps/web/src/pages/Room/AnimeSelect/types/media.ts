export interface Media {
  id: string
  title: string
  posterPath: string
  tmdbId?: string
  TMDBLink?: string
  createdAt: Date
}

export interface CursorPagination {
  nextCursor: string | null
  hasMore: boolean
  count: number
}

export interface MediaListResponse {
  data: Media[]
  pagination: CursorPagination
}
