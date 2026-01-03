import type {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import type {
  AnimeAddedData,
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@netflix-tinder/shared'
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
import { DisconnectTimerService } from 'src/room/services/disconnectTime.service'
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

  constructor(private readonly matchingService: MatchingService, private readonly disconnectTimerService: DisconnectTimerService) { }

  async handleConnection(client: TypedSocket) {
    try {
      const rawCookies = client.handshake.headers.cookie || ''
      const cookies = parseCookies(rawCookies)
      const userSession = cookies['user-session']
      let userId = ''

      if (!userSession) {
        userId = uuidv4()
        this.logger.debug(`New user connected: ${userId}`)
        client.emit('connection_established', { userId })
      } else {
        userId = JSON.parse(cookies['user-session'] || '').data
        this.logger.debug(`User connected: ${userId}`)
        const userConnected = await this.matchingService.checkUserConnected(userId)

        if (userConnected) {
          const roomId = await this.matchingService.getUserRoomId(userId)
          await client.join(roomId)
          client.data.roomId = roomId
          console.log(roomId)
          const roomData = await this.matchingService.getSnapshotOfRoom(roomId, userId)
          client.emit('sync_state', roomData)
        } else {
          client.emit('try_to_join')
        }
      }
      client.data.userId = userId
    } catch (e) {
      this.logger.error(`Failed to handle connection: ${e.message}`, e.stack)
      // await this.matchingService.clearRoomData(roomId, userId)
      client.emit('error_leave', { message: e.message, code: e.message })
    }
  }

  async handleDisconnect(client: TypedSocket) {
    const { userId, roomId } = client.data
    this.logger.debug(`Disconnecting client ${client.id}. Data: ${JSON.stringify(client.data)}`)

    if (roomId) {
      this.logger.log(`User ${userId} disconnected from room ${roomId}`)
      const socketId = `${roomId}_${userId}`
      await this.disconnectTimerService.setTimer(socketId, async () => {
        try {
          await this.matchingService.removeUserFromRoom(roomId, userId)
          this.server.to(roomId).emit('user_left', { userId })
        } catch (error) {
          this.logger.error(`Error in disconnect timer for ${userId}: ${error.message}`)
        }
      })
    }
  }

  @SubscribeMessage('create_room')
  async handleCreateRoom(
    @ConnectedSocket() client: TypedSocket,
  ) {
    const { userId } = client.data

    if (!userId) {
      this.logger.error('User is not authenticated')
      client.disconnect()
      return {
        success: false,
        error: { message: 'User is not authenticated', code: 'UNAUTHENTICATED' },
      }
    }

    try {
      const roomResponse = await this.matchingService.createRoom(userId)
      await client.join(roomResponse.inviteCode)
      client.data.roomId = roomResponse.inviteCode

      this.logger.log(`User ${userId} created room ${roomResponse.inviteCode}`)
      console.log(roomResponse)
      return {
        success: true,
        data: roomResponse,
      }
    } catch (error) {
      this.logger.error(`Create room error: ${error.message}`)
      return {
        success: false,
        error: { message: 'Failed to create room', code: 'CREATE_ROOM_FAILED' },
      }
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { userId } = client.data

    if (!userId) {
      this.logger.error('User is not authenticated')
      client.disconnect()
      return {
        success: false,
        error: { message: 'User is not authenticated', code: 'UNAUTHENTICATED' },
      }
    }

    if (!data?.roomId) {
      return {
        success: false,
        error: { message: 'Room ID is required', code: 'INVALID_PAYLOAD' },
      }
    }

    const newRoomId = data.roomId
    const currentRoomId = client.data.roomId

    try {
      if (currentRoomId === newRoomId) {
        this.logger.debug(`User ${userId} already in room ${newRoomId}`)
        const roomData = await this.matchingService.getRoomData(newRoomId)
        return {
          success: true,
          data: roomData,
        }
      }

      if (currentRoomId) {
        this.logger.log(`User ${userId} switching: ${currentRoomId} -> ${newRoomId}`)
        await this.matchingService.removeUserFromRoom(currentRoomId, userId)
        await client.leave(currentRoomId)
        this.server.to(currentRoomId).emit('user_left', { userId })
      }

      const result = await this.matchingService.addUserToRoom(newRoomId, userId)
      await client.join(newRoomId)
      client.data.roomId = newRoomId

      this.logger.log(`User ${userId} joined room ${newRoomId}`)
      const user = result.users.filter((user) => user.userId === userId)
      // Notify others in the room
      client.to(newRoomId).emit('user_joined', { ...user[0], usersCount: result.users.length })

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      this.logger.error(`Join room error for ${userId}: ${error.message}`)
      return {
        success: false,
        error: { message: error.message || 'Failed to join room', code: 'JOIN_ROOM_FAILED' },
      }
    }
  }

  @SubscribeMessage('add_anime')
  async handleAddAnime(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: { mediaId: string },
  ) {
    const { userId, roomId } = client.data

    if (!userId) {
      return {
        success: false,
        error: { message: 'User is not authenticated', code: 'UNAUTHENTICATED' },
      }
    }

    if (!roomId) {
      return {
        success: false,
        error: { message: 'User is not in a room', code: 'NOT_IN_ROOM' },
      }
    }

    if (!data?.mediaId) {
      return {
        success: false,
        error: { message: 'Media ID is required', code: 'INVALID_PAYLOAD' },
      }
    }

    try {
      const isAdded = await this.matchingService.addMediaToDraft(
        userId,
        roomId,
        data.mediaId,
      )

      if (isAdded) {
        const animeData: AnimeAddedData = { mediaId: data.mediaId, addedBy: userId }

        this.logger.log(`Anime ${data.mediaId} added to room ${roomId}`)

        return { success: true, data: animeData }
      } else {
        return {
          success: false,
          error: { message: 'Anime already in deck', code: 'ALREADY_EXISTS' },
        }
      }
    } catch (e) {
      this.logger.error(`Add anime error: ${e.message}`)
      return {
        success: false,
        error: { message: e.message || 'Failed to add anime', code: 'ADD_ANIME_FAILED' },
      }
    }
  }

  @SubscribeMessage('remove_media_from_draft')
  async handleDeleteAnime(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: { mediaId: string },
  ) {
    const { userId, roomId } = client.data

    if (!userId) {
      return {
        success: false,
        error: { message: 'User is not authenticated', code: 'UNAUTHENTICATED' },
      }
    }

    if (!roomId) {
      return {
        success: false,
        error: { message: 'User is not in a room', code: 'NOT_IN_ROOM' },
      }
    }

    if (!data?.mediaId) {
      return {
        success: false,
        error: { message: 'Media ID is required', code: 'INVALID_PAYLOAD' },
      }
    }

    try {
      const isDeleted = await this.matchingService.deleteMediaFromDraft(
        userId,
        roomId,
        data.mediaId,
      )

      if (isDeleted) {
        this.logger.log(`Anime ${data.mediaId} removed from room ${roomId} by user ${userId}`)
        return { success: true, data: { mediaId: data.mediaId } }
      } else {
        return {
          success: false,
          error: { message: 'Anime not found in your deck', code: 'NOT_FOUND' },
        }
      }
    } catch (e) {
      this.logger.error(`Delete anime error: ${e.message}`)
      return {
        success: false,
        error: { message: e.message || 'Failed to delete anime', code: 'DELETE_ANIME_FAILED' },
      }
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId: currentRoomId, userId } = client.data
    if (!userId) {
      return {
        success: false,
        error: { message: 'User is not authenticated', code: 'UNAUTHENTICATED' },
      }
    }

    if (!currentRoomId) {
      return {
        success: false,
        error: { message: 'User is not in a room', code: 'NOT_IN_ROOM' },
      }
    }
    if (currentRoomId !== data.roomId) {
      return {
        success: false,
        error: { message: 'User is not in the room', code: 'NOT_IN_ROOM' },
      }
    }

    try {
      await this.matchingService.removeUserFromRoom(currentRoomId, userId)
      await client.leave(currentRoomId)
      client.data.roomId = null
      this.server.to(currentRoomId).emit('user_left', { userId })
      return {
        success: true,
        data: { roomId: currentRoomId },
      }
    } catch (e) {
      this.logger.error(`Leave room error: ${e.message}`)
      return {
        success: false,
        error: { message: e.message || 'Failed to leave room', code: 'LEAVE_ROOM_FAILED' },
      }
    }
  }

  @SubscribeMessage('start_selecting')
  async handleStartSelecting(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const selectionRoomId = data.roomId
    if (!selectionRoomId || !client.data.userId) {
      return {
        success: false,
        error: { message: 'Failed to start Selection', code: 'START_SELECTIONS_FAILED' },
      }
    }

    const response = await this.matchingService.startSelections(selectionRoomId, client.data.userId)
    this.server.to(client.data.roomId).emit('sync_state', response)
    return { success: true, data: undefined }
  }
}
