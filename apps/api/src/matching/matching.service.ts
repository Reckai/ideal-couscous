import type { RoomState } from '../room/repositories'
import type { MatchFoundDTO } from './dto/swipes.dto'
import { Injectable } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { BaseRoomData, RoomData } from '@netflix-tinder/shared'
import { RoomStatus } from 'generated/prisma'
import { SwipeAction } from './dto/swipes.dto'
import {
  AbstractMatchingService,
  AbstractRoomLifecycleService,
  AbstractRoomSerializerService,
  AbstractRoomStateService,
  AbstractSelectionService,
  AbstractSwipeService,
} from './interfaces'

@Injectable()
export class MatchingService extends AbstractMatchingService {
  constructor(
    private readonly roomLifecycle: AbstractRoomLifecycleService,
    private readonly roomState: AbstractRoomStateService,
    private readonly selection: AbstractSelectionService,
    private readonly swipe: AbstractSwipeService,
    private readonly roomSerializer: AbstractRoomSerializerService,
  ) {
    super()
  }

  // Room Lifecycle
  async createRoom(userId: string): Promise<RoomData> {
    if (!userId) {
      throw new WsException('userId is required to create a room')
    }
    return this.roomLifecycle.createRoom(userId)
  }

  async addUserToRoom(roomId: string, userId: string): Promise<RoomData> {
    if (!roomId) {
      throw new WsException('roomId is required')
    }
    if (!userId) {
      throw new WsException('userId is required')
    }
    return this.roomLifecycle.addUserToRoom(roomId, userId)
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    return this.roomLifecycle.removeUserFromRoom(roomId, userId)
  }

  async clearRoomData(roomId: string, userId: string): Promise<void> {
    return this.roomLifecycle.clearRoomData(roomId, userId)
  }

  // Room State
  async validateRoomStatus(roomId: string): Promise<RoomState> {
    return this.roomState.validateRoomStatus(roomId)
  }

  async checkUserConnected(userId: string): Promise<boolean> {
    return this.roomState.checkUserConnected(userId)
  }

  async getUserRoomId(userId: string): Promise<string> {
    return this.roomState.getUserRoomId(userId)
  }

  async startSelections(roomId: string, userId: string): Promise<RoomData> {
    if (!roomId || !userId) {
      throw new WsException('roomId and userId are required to start selections')
    }
    await this.roomState.startSelections(roomId, userId)
    return this.roomSerializer.getSnapshotOfRoom(roomId, userId)
  }

  async setUserReadiness(roomId: string, userId: string, isReady: boolean): Promise<RoomStatus> {
    if (!roomId || !userId) {
      throw new WsException('roomId and userId are required')
    }
    return this.roomState.setUserReadiness(roomId, userId, isReady)
  }

  async handleUserDisconnect(roomId: string, userId: string): Promise<void> {
    return this.roomState.handleUserDisconnect(roomId, userId)
  }

  // Selection
  async addMediaToDraft(userId: string, roomId: string, mediaId: string): Promise<boolean> {
    if (!mediaId) {
      throw new WsException('mediaId is required')
    }
    return this.selection.addMediaToDraft(userId, roomId, mediaId)
  }

  async deleteMediaFromDraft(userId: string, roomId: string, mediaId: string): Promise<boolean> {
    if (!mediaId) {
      throw new WsException('mediaId is required')
    }
    return this.selection.deleteMediaFromDraft(userId, roomId, mediaId)
  }

  // Swipe
  async processSwipe(
    action: SwipeAction,
    userId: string,
    roomId: string,
    mediaId: string,
  ): Promise<{ isMatch: boolean, matchData?: MatchFoundDTO }> {
    if (!mediaId) {
      throw new WsException('mediaId is required')
    }
    if (!action || !Object.values(SwipeAction).includes(action)) {
      throw new WsException('Valid swipe action (LIKE/SKIP) is required')
    }
    return this.swipe.processSwipe(action, userId, roomId, mediaId)
  }

  // Serialization
  async getRoomData(roomId: string): Promise<BaseRoomData> {
    return this.roomSerializer.getRoomData(roomId)
  }

  async getSnapshotOfRoom(roomId: string, userId: string): Promise<RoomData> {
    return this.roomSerializer.getSnapshotOfRoom(roomId, userId)
  }

  async getMediaPoolWithDetails(roomId: string) {
    return this.roomSerializer.getMediaPoolWithDetails(roomId)
  }
}
