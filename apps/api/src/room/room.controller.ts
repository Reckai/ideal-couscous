import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { RoomResponseDTO } from './dto/room-response.dto';
import { RoomService } from './room.service';

// import { AuthGuard } from '@/guards/auth.guard'; // TODO
// import { CurrentUser } from '@/decorators/current-user.decorator'; // TODO

/**
 * RoomController - HTTP endpoints для управления комнатами
 *
 * Все endpoints требуют аутентификацию (TODO: добавить AuthGuard)
 */
@Controller('rooms')
// @UseGuards(AuthGuard) // TODO: Раскомментировать после реализации Auth
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
  async createRoom() // @CurrentUser('id') userId: string, // TODO

  : Promise<RoomResponseDTO> {
    // TEMP: Hardcoded userId для тестирования (удалить после Auth)
    const userId = 'temp-user-id-123';

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
    // @CurrentUser('id') userId: string, // TODO
  ): Promise<RoomResponseDTO> {
    // TEMP: Hardcoded userId
    const userId = 'temp-user-id-456';

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
    // @CurrentUser('id') userId: string, // TODO
  ): Promise<RoomResponseDTO> {
    // TEMP: Hardcoded userId
    const userId = 'temp-user-id-123';

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
    // @CurrentUser('id') userId: string, // TODO
  ): Promise<{
    bothSelected: boolean;
    mediaPoolSize?: number;
    message: string;
  }> {
    // TEMP: Hardcoded userId
    const userId = 'temp-user-id-123';

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
    // @CurrentUser('id') userId: string, // TODO
  ): Promise<{ bothReady: boolean; message: string }> {
    // TEMP: Hardcoded userId
    const userId = 'temp-user-id-123';

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
    // @CurrentUser('id') userId: string, // TODO
  ): Promise<{ message: string }> {
    // TEMP: Hardcoded userId
    const userId = 'temp-user-id-123';

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
    // @CurrentUser('id') userId: string, // TODO
  ): Promise<{ message: string }> {
    // TEMP: Hardcoded userId
    const userId = 'temp-user-id-123';

    await this.roomService.cancelRoom(roomId, userId);

    return { message: 'Room has been cancelled' };
  }
}
