import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { customAlphabet } from 'nanoid';
import { RoomRepository, RoomCacheRepository } from './repositories';

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
   *
   */
}
