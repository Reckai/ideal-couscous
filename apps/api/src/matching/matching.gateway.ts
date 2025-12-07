import { Server, Socket } from 'socket.io';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { MatchingService } from './matching.service';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { JoinRoomDTO } from './dto/join-room.dto';
import { AddMediaDTO } from './dto/swipes.dto';
interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    roomId?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/matching',
})
export class MatchingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MatchingGateway.name);

  constructor(private readonly matchingService: MatchingService) {}

  handleConnection(client: AuthenticatedSocket) {
    try {
      const rawCookies = client.handshake.headers.cookie;
      const cookies = cookieParser(rawCookies);

      let userId = cookies['anonymousUserId'];
      let isNew = false;
      if (!userId) {
        userId = uuidv4();
        isNew = true;
        this.logger.debug(`New user connected: ${userId}`);
      } else {
        this.logger.debug(`User connected: ${userId}`);
      }
      client.data.userId = userId;
      client.emit('connection_established', { userId, isNew });
    } catch (e) {
      this.logger.error(`Failed to handle connection: ${e.message}`, e.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const { userId, roomId } = client.data;
    if (roomId) {
      this.logger.log(`User ${userId} disconnected from room ${roomId}`);
      this.matchingService.removeUserFromRoom(roomId, userId);
      this.server.to(roomId).emit('user_left', { userId });
    }
  }

  @SubscribeMessage('create_room')
  async createRoom(client: AuthenticatedSocket) {
    const { userId } = client.data;

    if (!userId) {
      this.logger.error('User is not authenticated');
      client.disconnect();
      return;
    }
    try {
      const inviteCode = await this.matchingService.createRoom(userId);
      await client.join(inviteCode);
      client.data.roomId = inviteCode;
      client.emit('room_created', {
        userId,
        status: 'online',
        inviteCode,
      });
      this.logger.log(`Stateless User ${userId} created room ${inviteCode}`);
    } catch (error) {
      this.logger.error(`Create room error: ${error.message}`);
      client.emit('error', {
        message: 'Failed to create room',
        code: 'CREATE_ROOM_FAILED',
      });
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    client: AuthenticatedSocket,
    @MessageBody() data: JoinRoomDTO,
  ) {
    const { userId } = client.data;
    if (!userId) {
      this.logger.error(`User ${userId} is not authenticated`);
      client.disconnect();
      return;
    }
    if (!data?.roomId) {
      client.emit('error', {
        message: 'Room ID is required',
        code: 'INVALID_PAYLOAD',
      });
      return;
    }

    const newRoomId = data.roomId;
    const currentRoomId = client.data.roomId;

    try {
      if (currentRoomId === newRoomId) {
        this.logger.debug(`User ${userId} already in room ${newRoomId}`);
        return;
      }
      if (currentRoomId) {
        this.logger.log(
          `User ${userId} switching: ${currentRoomId} -> ${newRoomId}`,
        );
        await this.matchingService.removeUserFromRoom(currentRoomId, userId);
        await client.leave(currentRoomId);
        this.server.to(currentRoomId).emit('user_left', { userId });
      }
      await this.matchingService.addUserToRoom(newRoomId, userId);
      await client.join(newRoomId);
      client.data.roomId = newRoomId;
      client.emit('room_joined', {
        userId,
        status: 'online',
        roomId: newRoomId,
      });
      this.logger.log(`User ${userId} joined room ${newRoomId}`);
      this.server.to(newRoomId).emit('user_joined', { userId });
    } catch (error) {
      this.logger.error(`Join room error for ${userId}: ${error.message}`);

      client.emit('error', {
        message: error.message || 'Failed to join room',
        code: 'JOIN_ROOM_FAILED',
      });
    }
  }

  @SubscribeMessage('add_anime')
  async handleAddAnime(
    client: AuthenticatedSocket,
    @MessageBody() data: AddMediaDTO,
  ) {
    const { userId, roomId } = client.data;
    if (!data.mediaId) {
      client.emit('error', {
        message: 'Media Id not provided',
        code: 'ID_NOT_PROVIDED',
      });
    }
    try {
      const isAdded = await this.matchingService.addMediaToDraft(
        roomId,
        userId,
        data.mediaId,
      );
      if (isAdded) {
        this.server.to(roomId).emit('anime_added', {
          mediaId: data.mediaId,
          addedBy: userId, // Чтобы фронт мог написать "Вася добавил..."
        });
        this.logger.log(`Anime ${data.mediaId} added to room ${roomId}`);
      } else {
        client.emit('info', { message: 'Already in deck' });
      }
    } catch (e) {
      client.emit('error', { message: e.message });
    }
  }
}
