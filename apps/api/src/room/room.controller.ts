import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { RoomResponseDTO } from './dto/room-response.dto';
import { RoomService } from './room.service';
import { AnonymousUserGuard } from '../common/guards/anonymous-user.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * RoomController - HTTP endpoints для управления комнатами
 *
 * MVP v1: Все endpoints используют AnonymousUserGuard для автоматического создания/восстановления анонимных пользователей
 * v2: Добавить AuthGuard для зарегистрированных пользователей
 */
@Controller('rooms')
@UseGuards(AnonymousUserGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * POST /rooms
   * Создать новую комнату
   *
   * @body preferences - настройки фильтрации (жанры, рейтинг, год)
   * @returns RoomResponseDto с inviteCode
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRoom(
    @CurrentUser('id') userId: string,
  ): Promise<RoomResponseDTO> {
    return this.roomService.createRoom(userId);
  }

  /**
   * POST /rooms/:code/join
   * Присоединиться к комнате по invite коду
   *
   * @param code - 6-символьный invite code (например: ABC123)
   * @returns RoomResponseDto
   */
  @Post(':code/join')
  @HttpCode(HttpStatus.OK)
  async joinRoom(
    @Param('code') code: string,
    @CurrentUser('id') userId: string,
  ): Promise<RoomResponseDTO> {
    return this.roomService.joinRoom(userId, { inviteCode: code });
  }

  /**
   * GET /rooms/:roomId
   * Получить информацию о комнате
   *
   * @param roomId - UUID комнаты
   * @returns RoomResponseDto
   */
  @Get(':roomId')
  async getRoomById(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
  ): Promise<RoomResponseDTO> {
    return this.roomService.getRoomById(roomId, userId);
  }

  /**
   * POST /rooms/:roomId/selections
   * Отправить выборы фильмов (5-20 фильмов)
   *
   * @param roomId - UUID комнаты
   * @body mediaIds - массив ID выбранных фильмов
   * @param mediaIds - массив айдишников
   * @returns { bothSelected: boolean, mediaPoolSize?: number, message: string }
   */
  @Post(':roomId/selections')
  @HttpCode(HttpStatus.OK)
  async submitSelections(
    @Param('roomId') roomId: string,
    @Body('mediaIds') mediaIds: string[],
    @CurrentUser('id') userId: string,
  ): Promise<{
    bothSelected: boolean;
    mediaPoolSize?: number;
    message: string;
  }> {
    return this.roomService.submitSelections(roomId, userId, mediaIds);
  }

  /**
   * POST /rooms/:roomId/ready
   * Отметить себя готовым к свайпингу
   *
   * @param roomId - UUID комнаты
   * @returns { bothReady: boolean, message: string }
   */
  @Post(':roomId/ready')
  @HttpCode(HttpStatus.OK)
  async markUserReady(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ bothReady: boolean; message: string }> {
    return this.roomService.markUserReady(roomId, userId);
  }

  /**
   * POST /rooms/:roomId/start
   * Начать свайпинг (переход в статус SWIPING)
   *
   * @param roomId - UUID комнаты
   * @returns { message: string }
   */
  @Post(':roomId/start')
  @HttpCode(HttpStatus.OK)
  async startSwiping(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.roomService.startSwiping(roomId, userId);

    return { message: 'Swiping started. Connect via WebSocket to begin.' };
  }

  /**
   * POST /rooms/:roomId/cancel
   * Отменить комнату (выйти из неё)
   *
   * @param roomId - UUID комнаты
   * @returns { message: string }
   */
  @Post(':roomId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelRoom(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.roomService.cancelRoom(roomId, userId);

    return { message: 'Room has been cancelled' };
  }
}
