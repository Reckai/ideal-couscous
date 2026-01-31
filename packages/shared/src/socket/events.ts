export type UserStatus = 'online' | 'offline'

export type SwipeAction = 'LIKE' | 'SKIP'

export interface MatchFoundData {
  mediaId: string

  mediaTitle: string

  posterPath: string | null

  matchedAt: Date
}
export interface Error {
  message: string
  code: string
}
// Acknowledgement response types
export interface AckResponse<T = undefined> {
  success: true
  data: T
}

export interface AckError {
  success: false
  error: Error
}

export type AckCallback<T = undefined> = (response: AckResponse<T> | AckError) => void

// Response data types
export interface ConnectionData {
  userId: string
}
export interface User {
  userId: string
  nickName: string
}
export interface UserDTO {
  userId: string
  nickName: string
  isHost: boolean
}
// Room status types (mirrors Prisma enum but decoupled)
export type RoomStatus = 'WAITING' | 'SELECTING' | 'SWIPING' | 'MATCHED' | 'CANCELLED' | 'READY'

export interface BaseRoomData {
  inviteCode: string
  usersCount: number
  users: UserDTO[]
  status: RoomStatus
  selectedAnime?: string[]
}

interface WaitingRoomState extends BaseRoomData {
  status: 'WAITING'
}
interface SelectingRoomState extends BaseRoomData {
  status: 'SELECTING' | 'READY'
  selectedAnime: string[]
}
interface SwipingRoomState extends BaseRoomData {
  status: 'SWIPING'
  currentMediaIndex: number
  mediaQueue: string[]
}
export interface MatchedRoomState extends BaseRoomData {
  status: 'MATCHED'
  matchId: string
}
export type RoomData
  = | WaitingRoomState
    | SelectingRoomState
    | SwipingRoomState
    | MatchedRoomState

export interface AnimeAddedData {
  mediaId: string
  addedBy: string
}

// Server -> Client events (broadcasts only, no acks)
export interface ServerToClientEvents {
  connection_established: (data: ConnectionData) => void
  user_joined: (data: UserDTO & { usersCount: number }) => void
  user_left: (data: { userId: string }) => void
  anime_added: (data: AnimeAddedData) => void
  sync_state: (data: RoomData) => void
  try_to_join: (data: void) => void
  error_leave: (data: Error) => void
  user_ready_changed: (data: { userId: string, isReady: boolean }) => void
  match_found: (data: MatchFoundData) => void
  queue_finished: () => void
}

// Client -> Server events (with acknowledgement callbacks)
export interface ClientToServerEvents {
  create_room: (callback: AckCallback<RoomData>) => void
  join_room: (data: { roomId: string }, callback: AckCallback<RoomData>) => void
  add_anime: (data: { mediaId: string }, callback: AckCallback<AnimeAddedData>) => void
  leave_room: (data: { roomId: string }, callback: AckCallback<void>) => void
  start_selecting: (data: { roomId: string }, callback: AckCallback<void>) => void
  remove_media_from_draft: (data: { mediaId: string }, callback: AckCallback<{ mediaId: string }>) => void
  set_ready: (data: { isReady: boolean }, callback: AckCallback<void>) => void
  swipe: (data: { mediaId: string, action: SwipeAction }, callback: AckCallback<void>) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  roomId?: string
}
