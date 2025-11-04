import { Injectable } from '@nestjs/common';
import { RoomCacheRepository } from './room/repositories';
import { randomUUID } from 'crypto';

@Injectable()
export class AppService {
  constructor(private readonly roomCacheRepository: RoomCacheRepository) {}

  getHello(): string {
    return 'Hello World!';
  }

  async testSaveSwipe(): Promise<string> {
    const roomId = randomUUID();
    const userId = randomUUID();
    const mediaId = randomUUID();
    const liked = Math.random() > 0.5;

    await this.roomCacheRepository.saveSwipe(roomId, userId, mediaId, liked);

    return `Saved swipe for user ${userId} in room ${roomId} for media ${mediaId} with liked: ${liked}`;
  }
  async getTestSwipe(): Promise<string> {
    return await this.roomCacheRepository.getSwipe(
      '7d6bb340-826f-4212-89e2-a873e8af1658',
      'f63f287a-645e-4637-b59d-6a43e799bdce',
      '8caa357f-e216-4a37-948e-a83484a4fee3',
    );
  }
}
