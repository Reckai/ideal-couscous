export interface CursorPagination {
  limit?: number;
  cursor?: string;
  search?: string;
}

export interface CursorPaginationResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    count: number;
  };
}
