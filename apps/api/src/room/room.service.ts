// apps/api/src/modules/room/room.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { customAlphabet } from 'nanoid';
import { RoomRepository, RoomCacheRepository } from './repositories';

import { RoomStatus } from 'generated/prisma';
import { RoomResponseDTO } from './dto/room-response.dto';
import { JoinRoomDTO } from './dto/join-room.dto';

/**
 * RoomService - бизнес-логика для управления комнатами
 * Оркестрирует работу PostgreSQL (долгосрочное) и Redis (временное)
 */
@Injectable()
export class RoomService {
  // Генератор invite кодов: 6 символов, URL-safe
  private readonly generateInviteCode = customAlphabet(
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // без I, O, 0, 1 (визуально похожи)
    6,
  );

  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly roomCacheRepository: RoomCacheRepository,
  ) {}

  /**
   * Создать новую комнату
   * Flow:
   * 1. Генерируем уникальный invite code
   * 2. Создаем запись в PostgreSQL (status: WAITING)
   * 3. Инициализируем состояние в Redis
   */
  async createRoom(userId: string): Promise<RoomResponseDTO> {
    // Генерируем invite code с защитой от коллизий
    let inviteCode: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      inviteCode = this.generateInviteCode();
      attempts++;

      if (attempts >= maxAttempts) {
        throw new ConflictException(
          'Failed to generate unique invite code. Please try again.',
        );
      }
    } while (await this.roomRepository.findByInviteCode(inviteCode));

    // Создаем комнату в PostgreSQL
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    const room = await this.roomRepository.create(
      userId,
      inviteCode,
      expiresAt,
    );

    // Инициализируем состояние в Redis (TTL 30 минут)
    await this.roomCacheRepository.initRoomState(room.id, RoomStatus.WAITING);

    return this.mapToResponseDto(room, userId);
  }

  /**
   * Присоединиться к комнате по invite коду
   * Flow:
   * 1. Проверяем существование комнаты
   * 2. Валидируем статус (должен быть WAITING)
   * 3. Добавляем гостя в PostgreSQL
   * 4. Обновляем статус на SELECTING
   * 5. Обновляем Redis
   */
  async joinRoom(userId: string, dto: JoinRoomDTO): Promise<RoomResponseDTO> {
    const room = await this.roomRepository.findByInviteCode(dto.inviteCode);

    if (!room) {
      throw new NotFoundException(
        `Room with invite code "${dto.inviteCode}" not found`,
      );
    }

    // Валидация бизнес-правил
    if (room.status !== RoomStatus.WAITING) {
      throw new ConflictException('Room is not accepting new members');
    }

    if (room.hostId === userId) {
      throw new ConflictException('You cannot join your own room');
    }

    if (room.guestId) {
      throw new ConflictException('Room is already full');
    }

    // Добавляем гостя + меняем статус на SELECTING
    const updatedRoom = await this.roomRepository.addGuest(room.id, userId);
    await this.roomRepository.updateStatus(room.id, RoomStatus.SELECTING);

    // Обновляем Redis
    await this.roomCacheRepository.updateRoomStatus(
      room.id,
      RoomStatus.SELECTING,
    );
    await this.roomCacheRepository.refreshRoomTTL(
      room.id,
      room.hostId,
      room.guestId,
    ); // Продлеваем TTL

    return this.mapToResponseDto(
      { ...updatedRoom, status: RoomStatus.SELECTING },
      userId,
    );
  }

  /**
   * Получить комнату по ID
   * Проверяет доступ пользователя (только участники)
   */
  async getRoomById(roomId: string, userId: string): Promise<RoomResponseDTO> {
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    // Проверяем, что пользователь - участник комнаты
    if (!this.isRoomMember(room, userId)) {
      throw new ForbiddenException('You are not a member of this room');
    }

    return this.mapToResponseDto(room, userId);
  }

  /**
   * Отправить выборы фильмов (каждый участник выбирает N фильмов)
   * Flow:
   * 1. Валидируем участие в комнате
   * 2. Проверяем статус (должен быть SELECTING)
   * 3. Сохраняем selections в Redis
   * 4. Если оба выбрали → создаем media pool + переходим в READY (НЕ SWIPING)
   */
  async submitSelections(
    roomId: string,
    userId: string,
    mediaIds: string[],
  ): Promise<{
    bothSelected: boolean;
    mediaPoolSize?: number;
    message: string;
  }> {
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    if (!this.isRoomMember(room, userId)) {
      throw new ForbiddenException('You are not a member of this room');
    }

    if (room.status !== RoomStatus.SELECTING) {
      throw new BadRequestException(
        'Room is not in selection phase. Current status: ' + room.status,
      );
    }

    // Валидируем количество выборов (например, от 5 до 20)
    if (mediaIds.length < 5 || mediaIds.length > 20) {
      throw new BadRequestException(
        'Please select between 5 and 20 movies/series',
      );
    }

    // Сохраняем в Redis
    await this.roomCacheRepository.saveUserSelections(roomId, userId, mediaIds);

    // Проверяем, оба ли участника выбрали
    const hostSelections = await this.roomCacheRepository.getUserSelections(
      roomId,
      room.hostId,
    );
    const guestSelections = room.guestId
      ? await this.roomCacheRepository.getUserSelections(roomId, room.guestId)
      : null;

    const bothSelected = hostSelections && guestSelections;

    if (bothSelected) {
      // Создаем объединенный media pool (пересечение + уникальные)
      const mediaPool = this.createMediaPool(hostSelections, guestSelections);
      await this.roomCacheRepository.createMediaPool(roomId, mediaPool);

      // Переводим в статус READY (пользователи еще не готовы свайпать!)
      await this.roomRepository.updateStatus(roomId, RoomStatus.READY);
      await this.roomCacheRepository.updateRoomStatus(roomId, RoomStatus.READY);

      return {
        bothSelected: true,
        mediaPoolSize: mediaPool.length,
        message: `Both users have selected! ${mediaPool.length} movies in the pool. Click "Ready" when you want to start swiping.`,
      };
    }

    return {
      bothSelected: false,
      message:
        'Your selection saved. Waiting for the other user to complete their selection.',
    };
  }

  /**
   * Отметить пользователя готовым к свайпингу
   * Flow:
   * 1. Проверяем, что комната в статусе READY
   * 2. Устанавливаем флаг готовности в Redis
   * 3. Если оба готовы → возвращаем true (фронтенд может вызвать startSwiping)
   */
  async markUserReady(
    roomId: string,
    userId: string,
  ): Promise<{ bothReady: boolean; message: string }> {
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    if (!this.isRoomMember(room, userId)) {
      throw new ForbiddenException('You are not a member of this room');
    }

    if (room.status !== RoomStatus.READY) {
      throw new BadRequestException(
        'Room is not ready. Both users must complete their selections first.',
      );
    }

    // Устанавливаем готовность текущего пользователя
    await this.roomCacheRepository.setUserReadiness(
      roomId,
      room.hostId === userId,
      true,
    );

    // Проверяем готовность обоих
    const roomState = await this.roomCacheRepository.getRoomState(roomId);

    if (!roomState) {
      throw new NotFoundException('Room state not found in cache');
    }

    const bothReady = roomState.hostReady && roomState.guestReady;

    if (bothReady) {
      return {
        bothReady: true,
        message: 'Both users are ready! You can now start swiping.',
      };
    }

    const isHost = room.hostId === userId;
    const waitingFor = isHost ? 'guest' : 'host';

    return {
      bothReady: false,
      message: `You are ready! Waiting for ${waitingFor} to be ready.`,
    };
  }

  /**
   * Начать свайпинг (переход в статус SWIPING)
   * Должны быть готовы оба участника (проверяем флаги в Redis)
   */
  async startSwiping(roomId: string, userId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    if (!this.isRoomMember(room, userId)) {
      throw new ForbiddenException('You are not a member of this room');
    }

    if (room.status !== RoomStatus.READY) {
      throw new BadRequestException(
        'Room is not ready for swiping. Current status: ' + room.status,
      );
    }

    // Проверяем, что оба пользователя отметились готовыми
    const roomState = await this.roomCacheRepository.getRoomState(roomId);

    if (!roomState) {
      throw new NotFoundException('Room state not found in cache');
    }

    if (!roomState.hostReady || !roomState.guestReady) {
      throw new BadRequestException(
        'Both users must mark themselves as ready before starting',
      );
    }

    // Обновляем статус
    await this.roomRepository.updateStatus(roomId, RoomStatus.SWIPING);
    await this.roomCacheRepository.updateRoomStatus(roomId, RoomStatus.SWIPING);
  }

  /**
   * Отменить комнату (выйти из неё)
   * Любой участник может отменить
   */
  async cancelRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    if (!this.isRoomMember(room, userId)) {
      throw new ForbiddenException('You are not a member of this room');
    }

    // Обновляем статус на CANCELLED
    await this.roomRepository.updateStatus(roomId, RoomStatus.CANCELLED);

    // Удаляем данные из Redis (cleanup)
    await this.roomCacheRepository.deleteRoomData(
      roomId,
      room.hostId,
      room.guestId,
    );
  }

  // ============================================================================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ============================================================================

  /**
   * Проверяет, является ли пользователь участником комнаты
   */
  private isRoomMember(
    room: { hostId: string; guestId: string | null },
    userId: string,
  ): boolean {
    return room.hostId === userId || room.guestId === userId;
  }

  /**
   * Создает объединенный media pool из выборов обоих участников
   * Логика: пересечение идет первым, потом уникальные (перемешанные)
   */
  private createMediaPool(
    hostSelections: string[],
    guestSelections: string[],
  ): string[] {
    const hostSet = new Set(hostSelections);
    const guestSet = new Set(guestSelections);

    // Пересечение (совпадения)
    const intersection = hostSelections.filter((id) => guestSet.has(id));

    // Уникальные для каждого
    const hostUnique = hostSelections.filter((id) => !guestSet.has(id));
    const guestUnique = guestSelections.filter((id) => !hostSet.has(id));

    // Перемешиваем уникальные
    const uniqueShuffled = this.shuffle([...hostUnique, ...guestUnique]);

    // Финальный пул: сначала пересечения, потом уникальные
    return [...intersection, ...uniqueShuffled];
  }

  /**
   * Перемешивает массив (Fisher-Yates shuffle)
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Маппинг внутренней модели на DTO для ответа
   */
  private mapToResponseDto(
    room: {
      id: string;
      inviteCode: string;
      status: RoomStatus;
      hostId: string;
      guestId: string | null;
      preferences: any;
      createdAt: Date;
      updatedAt: Date;
      expiresAt: Date;
    },
    currentUserId: string,
  ): RoomResponseDTO {
    return {
      id: room.id,
      inviteCode: room.inviteCode,
      status: room.status,
      isHost: room.hostId === currentUserId,
      hasGuest: !!room.guestId,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
      updatedAt: room.updatedAt,
    };
  }
}
