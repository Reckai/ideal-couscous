import type { ClientToServerEvents, ServerToClientEvents } from '@netflix-tinder/shared'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000'
const fullUrl = `${WS_URL}/matching`

export const socket: TypedSocket = io(fullUrl, {
  autoConnect: false,
  transports: ['websocket'],
  withCredentials: true,

})
