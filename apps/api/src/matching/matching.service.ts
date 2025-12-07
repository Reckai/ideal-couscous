import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../Prisma/prisma.service';
import {
  RoomCacheRepository,
  RoomRepository,
  RoomWithRelations,
} from '../room/repositories';
import { MatchingCacheRepository } from './repositories/matching-cache.repository';
import { RoomStatus } from 'generated/prisma';
import { MatchFoundDTO, SwipeAction } from './dto/swipes.dto';

import { customAlphabet } from 'nanoid';
import { WsException } from '@nestjs/websockets';
@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomRepo: RoomRepository,
    private readonly roomCache: RoomCacheRepository,
    private readonly matchingCache: MatchingCacheRepository,
  ) {}

  /**
   * Validates room exists and is in SWIPING state
   * @param roomId - Room UUID
   * @returns Room data
   * @throws {BadRequestException} If room not found or wrong status
   */
  async validateRoomStatus(roomId: string): Promise<RoomWithRelations> {
    const room = await this.roomRepo.findById(roomId);

    if (!room) {
      throw new BadRequestException('Room not found');
    }

    if (room.status !== RoomStatus.SWIPING) {
      throw new BadRequestException(
        `Room is not in SWIPING state. Current status: ${room.status}`,
      );
    }

    return room;
  }

  /**
   * Validates user is a member of the room (host or guest)
   * @param room - Room data
   * @param userId - User UUID
   * @throws {BadRequestException} If user is not a member
   */
  validateUserMembership(room: RoomWithRelations, userId: string): void {
    const isHost = room.hostId === userId;
    const isGuest = room.guestId !== null && room.guestId === userId;

    if (!isHost && !isGuest) {
      throw new BadRequestException('You are not a member of this room');
    }
  }

  private checkMatch(hostSwipe: SwipeAction, guestSwipe: SwipeAction) {
    return hostSwipe === SwipeAction.LIKE && guestSwipe === SwipeAction.LIKE;
  }

  private async saveMatchToDatabase(
    roomId: string,
    mediaId: string,
  ): Promise<void> {
    await this.roomRepo.createMatch(roomId, mediaId);
    this.logger.log(`Match saved to database for room ${roomId}`);
  }
  private async updateRoomToMatched(roomId: string): Promise<void> {
    await this.roomRepo.updateStatus(roomId, RoomStatus.MATCHED);
    await this.roomCache.updateRoomStatus(roomId, RoomStatus.MATCHED);
    this.logger.log(`Room ${roomId} status updated to MATCHED`);
  }
  private readonly generateInviteCode = customAlphabet(
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    6,
  );
  async createRoom(userId: string): Promise<string> {
    const roomId = this.generateInviteCode();

    try {
      await this.roomCache.initRoom(roomId, userId);

      return roomId;
    } catch (error) {}
  }

  async removeUserFromRoom(roomId: string, userId: string) {
    await this.roomCache.removeUserFromRoom(roomId, userId);
  }

  async addUserToRoom(roomId: string, userId: string): Promise<void> {
    const roomExist = await this.roomCache.validateRoomExistense(roomId);

    if (!roomExist) {
      throw new NotFoundException(`Room with id ${roomId} not found`);
    }
    const userCount = await this.roomCache.getRoomUserCount(roomId);
    if (userCount >= 2) {
      throw new BadRequestException(`Room is full`);
    }

    await this.roomCache.addUserToRoom(roomId, userId);
  }
  async addMediaToDraft(
    userId: string,
    roomId: string,
    mediaId: string,
  ): Promise<boolean> {
    const isMember = await this.roomCache.isUserInRoom(roomId, userId);
    if (!isMember) {
      throw new WsException('User is not member of the room');
    }
    const roomStatus = await this.roomCache.getRoomStatus(roomId);
    if (roomStatus !== 'WAITING' && roomStatus !== 'SELECTING') {
      throw new WsException('Cannot add items in current room state');
    }

    try {
      const result = await this.roomCache.saveUserSelection(roomId, mediaId);

      return result === 1;
    } catch (e) {
      if (e.message === 'Draft limit reached') {
        throw new WsException('Deck limit reached (max 50)');
      }
      throw e;
    }
  }
  async processSwipe(
    action: SwipeAction,
    userId: string,
    roomId: string,
    mediaId: string,
  ): Promise<{ isMatch: boolean; matchData?: MatchFoundDTO }> {
    const room = await this.validateRoomStatus(roomId);
    await this.validateRoomStatus(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    this.validateUserMembership(room, userId);
    await this.matchingCache.saveSwipe(roomId, userId, mediaId, action);

    this.logger.log(
      `User ${userId} swiped ${action} on media ${mediaId} in room ${roomId}`,
    );

    const { hostSwipe, guestSwipe } =
      await this.matchingCache.getSwipesForMedia(
        room.id,
        mediaId,
        room.hostId,
        room.guestId,
      );

    if (!(hostSwipe && guestSwipe)) {
      return { isMatch: false };
    }

    const isMatch = this.checkMatch(hostSwipe, guestSwipe);
    if (!isMatch) {
      return { isMatch: false };
    }
    this.logger.log(`MATCH found in room ${roomId} for media ${mediaId}`);
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    this.saveMatchToDatabase(room.id, mediaId).catch((err) => {
      this.logger.error(`Failed to save match to database: ${err.message}`);
    });

    this.updateRoomToMatched(roomId).catch((err) => {
      this.logger.error(`Failed to update room status: ${err.message}`);
    });

    const matchData: MatchFoundDTO = {
      mediaId: media.id,
      mediaTitle: media.title,
      posterPath: media.posterPath,
      matchedAt: new Date(),
    };

    return { isMatch: true, matchData };
  }
  async handleUserDisconnect(roomId: string, userId: string): Promise<void> {
    this.logger.log(`User ${userId} disconnected from room ${roomId}`);

    // Update room status to CANCELLED
    await this.roomRepo.updateStatus(roomId, RoomStatus.CANCELLED);
    await this.roomCache.updateRoomStatus(roomId, RoomStatus.CANCELLED);

    // Note: We keep swipes for potential reconnection/debugging
    // They will expire with TTL anyway
  }
  async getMediaPoolWithDetails(roomId: string) {
    const mediaIds = await this.roomCache.getMediaPool(roomId);

    // Достаем детали из PostgreSQL
    const media = await this.prisma.media.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, title: true, posterPath: true },
    });

    // Возвращаем в том же порядке что в pool
    return mediaIds.map((id) => media.find((m) => m.id === id));
  }
}
