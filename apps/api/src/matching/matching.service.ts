import type { RoomState } from '../room/repositories'
import type { MatchFoundDTO } from './dto/swipes.dto'
import { Injectable } from '@nestjs/common'
import { BaseRoomData, RoomData } from '@netflix-tinder/shared'
import { RoomStatus } from 'generated/prisma'
import { SwipeAction } from './dto/swipes.dto'
import { RoomLifecycleService } from './services/room-lifecycle.service'
import { RoomSerializerService } from './services/room-serializer.service'
import { RoomStateService } from './services/room-state.service'
import { SelectionService } from './services/selection.service'
import { SwipeService } from './services/swipe.service'

@Injectable()
export class MatchingService {
  constructor(
    private readonly roomLifecycle: RoomLifecycleService,
    private readonly roomState: RoomStateService,
    private readonly selection: SelectionService,
    private readonly swipe: SwipeService,
    private readonly roomSerializer: RoomSerializerService,
  ) {}

  // Room Lifecycle
  async createRoom(userId: string): Promise<RoomData> {
    return this.roomLifecycle.createRoom(userId)
  }

  async addUserToRoom(roomId: string, userId: string): Promise<RoomData> {
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
    await this.roomState.startSelections(roomId, userId)
    return this.roomSerializer.getSnapshotOfRoom(roomId, userId)
  }

  async setUserRediness(roomId: string, userId: string, isReady: boolean): Promise<RoomStatus> {
    return this.roomState.setUserReadiness(roomId, userId, isReady)
  }

  async handleUserDisconnect(roomId: string, userId: string): Promise<void> {
    return this.roomState.handleUserDisconnect(roomId, userId)
  }

  // Selection
  async addMediaToDraft(userId: string, roomId: string, mediaId: string): Promise<boolean> {
    return this.selection.addMediaToDraft(userId, roomId, mediaId)
  }

  async deleteMediaFromDraft(userId: string, roomId: string, mediaId: string): Promise<boolean> {
    return this.selection.deleteMediaFromDraft(userId, roomId, mediaId)
  }

  // Swipe
  async processSwipe(
    action: SwipeAction,
    userId: string,
    roomId: string,
    mediaId: string,
  ): Promise<{ isMatch: boolean, matchData?: MatchFoundDTO }> {
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
