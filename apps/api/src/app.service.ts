import { Injectable } from '@nestjs/common';
import { RoomCacheRepository } from './room/repositories';

@Injectable()
export class AppService {
  constructor(private readonly roomCacheRepository: RoomCacheRepository) {}

  getHello(): string {
    return 'Hello World!';
  }
}
