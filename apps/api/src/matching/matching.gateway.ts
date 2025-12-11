import type {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import type {
  AckCallback,
  AnimeAddedData,
  ClientToServerEvents,
  InterServerEvents,
  RoomData,
  ServerToClientEvents,
  SocketData,
} from '@shared'
import type { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { parse as parseCookies } from 'cookie'
import { v4 as uuidv4 } from 'uuid'
import { MatchingService } from './matching.service'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/matching',
})
export class MatchingGateway
implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: TypedServer

  private readonly logger = new Logger(MatchingGateway.name)

  constructor(private readonly matchingService: MatchingService) {}

  handleConnection(client: TypedSocket) {
    try {
      const rawCookies = client.handshake.headers.cookie || ''
      const cookies = parseCookies(rawCookies)

      let userId = cookies.anonymousUserId
      let isNew = false
      if (!userId) {
        userId = uuidv4()
        isNew = true
        this.logger.debug(`New user connected: ${userId}`)
      } else {
        this.logger.debug(`User connected: ${userId}`)
      }
      client.data.userId = userId
      client.emit('connection_established', { userId, isNew })
    } catch (e) {
      this.logger.error(`Failed to handle connection: ${e.message}`, e.stack)
      client.disconnect()
    }
  }

  handleDisconnect(client: TypedSocket) {
    const { userId, roomId } = client.data
    if (roomId) {
      this.logger.log(`User ${userId} disconnected from room ${roomId}`)
      this.matchingService.removeUserFromRoom(roomId, userId)
      this.server.to(roomId).emit('user_left', { userId })
    }
  }

  @SubscribeMessage('create_room')
  async handleCreateRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() callback: AckCallback<RoomData>,
  ) {
    const { userId } = client.data

    if (!userId) {
      this.logger.error('User is not authenticated')
      callback({
        success: false,
        error: { message: 'User is not authenticated', code: 'UNAUTHENTICATED' },
      })
      client.disconnect()
      return
    }

    try {
      const inviteCode = await this.matchingService.createRoom(userId)
      await client.join(inviteCode)
      client.data.roomId = inviteCode

      this.logger.log(`User ${userId} created room ${inviteCode}`)

      callback({
        success: true,
        data: { userId, status: 'online', inviteCode },
      })
    } catch (error) {
      this.logger.error(`Create room error: ${error.message}`)
      callback({
        success: false,
        error: { message: 'Failed to create room', code: 'CREATE_ROOM_FAILED' },
      })
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: { roomId: string },
    @MessageBody() callback: AckCallback<RoomData>,
  ) {
    const { userId } = client.data

    if (!userId) {
      this.logger.error('User is not authenticated')
      callback({
        success: false,
        error: { message: 'User is not authenticated', code: 'UNAUTHENTICATED' },
      })
      client.disconnect()
      return
    }

    if (!data?.roomId) {
      callback({
        success: false,
        error: { message: 'Room ID is required', code: 'INVALID_PAYLOAD' },
      })
      return
    }

    const newRoomId = data.roomId
    const currentRoomId = client.data.roomId

    try {
      if (currentRoomId === newRoomId) {
        this.logger.debug(`User ${userId} already in room ${newRoomId}`)
        callback({
          success: true,
          data: { userId, status: 'online', inviteCode: newRoomId },
        })
        return
      }

      if (currentRoomId) {
        this.logger.log(`User ${userId} switching: ${currentRoomId} -> ${newRoomId}`)
        await this.matchingService.removeUserFromRoom(currentRoomId, userId)
        await client.leave(currentRoomId)
        this.server.to(currentRoomId).emit('user_left', { userId })
      }

      await this.matchingService.addUserToRoom(newRoomId, userId)
      await client.join(newRoomId)
      client.data.roomId = newRoomId

      this.logger.log(`User ${userId} joined room ${newRoomId}`)

      // Notify others in the room
      this.server.to(newRoomId).emit('user_joined', { userId })

      callback({
        success: true,
        data: { userId, status: 'online', inviteCode: newRoomId },
      })
    } catch (error) {
      this.logger.error(`Join room error for ${userId}: ${error.message}`)
      callback({
        success: false,
        error: { message: error.message || 'Failed to join room', code: 'JOIN_ROOM_FAILED' },
      })
    }
  }

  @SubscribeMessage('add_anime')
  async handleAddAnime(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: { mediaId: string },
    @MessageBody() callback: AckCallback<AnimeAddedData>,
  ) {
    const { userId, roomId } = client.data

    if (!userId) {
      callback({
        success: false,
        error: { message: 'User is not authenticated', code: 'UNAUTHENTICATED' },
      })
      return
    }

    if (!roomId) {
      callback({
        success: false,
        error: { message: 'User is not in a room', code: 'NOT_IN_ROOM' },
      })
      return
    }

    if (!data?.mediaId) {
      callback({
        success: false,
        error: { message: 'Media ID is required', code: 'INVALID_PAYLOAD' },
      })
      return
    }

    try {
      const isAdded = await this.matchingService.addMediaToDraft(
        roomId,
        userId,
        data.mediaId,
      )

      if (isAdded) {
        const animeData: AnimeAddedData = { mediaId: data.mediaId, addedBy: userId }

        // Broadcast to all in the room (including sender)
        this.server.to(roomId).emit('anime_added', animeData)

        this.logger.log(`Anime ${data.mediaId} added to room ${roomId}`)

        callback({ success: true, data: animeData })
      } else {
        callback({
          success: false,
          error: { message: 'Anime already in deck', code: 'ALREADY_EXISTS' },
        })
      }
    } catch (e) {
      this.logger.error(`Add anime error: ${e.message}`)
      callback({
        success: false,
        error: { message: e.message || 'Failed to add anime', code: 'ADD_ANIME_FAILED' },
      })
    }
  }
}
