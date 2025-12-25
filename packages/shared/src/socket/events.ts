export type UserStatus = 'online' | 'offline'

// Acknowledgement response types
export interface AckResponse<T = undefined> {
  success: true
  data: T
}

export interface AckError {
  success: false
  error: {
    message: string
    code: string
  }
}

export type AckCallback<T = undefined> = (response: AckResponse<T> | AckError) => void

// Response data types
export interface ConnectionData {
  userId: string
  isNew: boolean
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
export interface RoomData {
  inviteCode: string
  usersCount: number
  users: UserDTO[]
}

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
}

// Client -> Server events (with acknowledgement callbacks)
export interface ClientToServerEvents {
  create_room: (callback: AckCallback<RoomData>) => void
  join_room: (data: { roomId: string }, callback: AckCallback<RoomData>) => void
  add_anime: (data: { mediaId: string }, callback: AckCallback<AnimeAddedData>) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  roomId?: string
}
