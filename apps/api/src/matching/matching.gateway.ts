import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ErrorDto,
  SwipeDTO,
  SwipeResponseDTO,
  UserStatusDto,
} from './dto/swipes.dto';

import { MatchingService } from './matching.service';
import { JoinRoomDTO } from './dto/join-room.dto';
import { UserService } from '../user';

// For now, we'll pass userId in the connection query params
interface AuthenticatedSocket extends Socket {
  userId?: string;
  roomId?: string;
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
  // Track online users per room: { roomId: Set<userId> }
  private roomUsers = new Map<string, Set<string>>();
  constructor(
    private readonly matchingService: MatchingService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    // TODO: Extract userId from session cookie when auth is ready
    // For now, expect userId in query params (TEMPORARY)
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      this.logger.warn(
        `Connection rejected: missing userId (socket ${client.id})`,
      );
      client.emit('error', {
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      } as ErrorDto);
      client.disconnect();
      return;
    }
    client.userId = userId;
    this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
  }
  async handleDisconnect(client: AuthenticatedSocket) {
    const { userId, roomId } = client;
    this.logger.log(
      `Client disconnected: ${client.id} (user: ${userId}, room: ${roomId})`,
    );

    if (roomId && userId) {
      const roomUsers = this.roomUsers.get(roomId);
      if (roomUsers) {
        this.roomUsers.delete(userId);
        client.to(roomId).emit('user_left', {
          userId,
          status: 'offline',
        } as UserStatusDto);
        await this.matchingService
          .handleUserDisconnect(roomId, userId)
          .catch((err) => {
            this.logger.error(
              `Error handling disconnect: ${err.message}`,
              err.stack,
            );
          });
        if (roomUsers.size === 0) {
          this.roomUsers.delete(roomId);
        }
      }
    }
  }
  @SubscribeMessage('join_room')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinRoomDTO,
  ) {
    const { userId } = client;
    const { roomId } = data;
    try {
      const room = await this.matchingService.validateRoomStatus(roomId);
      this.matchingService.validateUserMembership(room, userId);
      await client.join(roomId);
      client.roomId = roomId;
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, new Set());
        this.roomUsers.get(roomId)!.add(userId!);

        this.logger.log(`User ${userId} joined room ${roomId}`);
        const mediaPool = await this.matchingService.getMediaPoolWithDetails(
          room.id,
        );

        client.to(roomId).emit('user_joined', {
          userId,
          status: 'online',
          mediaPool,
        });
      }
    } catch (err) {
      this.logger.error(`Error joining room: ${err.message}`, err.stack);
      client.emit('error', {
        message: err.message,
        code: 'JOIN_FAILED',
      } as ErrorDto);
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(@ConnectedSocket() client: AuthenticatedSocket) {
    const { userId, roomId } = client;

    if (!roomId) {
      return;
    }
    this.logger.log(`User ${userId} leaving room ${roomId}`);

    const roomUsers = this.roomUsers.get(roomId);
    if (roomUsers) {
      roomUsers.delete(userId!);
    }

    client.to(roomId).emit('user_left', {
      userId,
      status: 'offline',
    } as UserStatusDto);

    await client.leave(roomId);
    client.roomId = undefined;
    await this.matchingService
      .handleUserDisconnect(roomId, userId!)
      .catch((err) => {
        this.logger.error(
          `Error handling leave room: ${err.message}`,
          err.stack,
        );
      });
  }

  @SubscribeMessage('swipe')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleSwipe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SwipeDTO,
  ) {
    const { userId, roomId } = client;
    const { mediaId, action } = data;

    if (!roomId) {
      client.emit('error', {
        message: 'You must join a room first',
        code: 'NOT_IN_ROOM',
      } as ErrorDto);
      return;
    }
    try {
      const result = await this.matchingService.processSwipe(
        action,
        userId,
        roomId,
        mediaId,
      );

      client.emit('swipe_received', {
        userId,
        roomId,
        action,
        mediaId,
      } as SwipeResponseDTO);

      if (result.isMatch) {
        this.server.to(roomId).emit('match_found', result.matchData);
        this.logger.log(`Match emitted to room ${roomId}`);
      }
    } catch (err) {
      this.logger.error(`Error processing swipe: ${err.message}`, err.stack);
      client.emit('error', {
        message: err.message,
        code: 'SWIPE_FAILED',
      });
    }
  }

  private parseCookies(cookieHeader?: string): Record<string, string> {
    if (!cookieHeader) {
      return {};
    }
    return cookieHeader.split(';').reduce(
      (cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
        return cookies;
      },
      {} as Record<string, string>,
    );
  }
}
