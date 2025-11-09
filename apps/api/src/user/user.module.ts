import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

/**
 * UserModule - модуль управления пользователями
 * Global module для доступа из любого модуля приложения
 *
 * Exports:
 * - UserService: для работы с пользователями в других модулях
 * - UserRepository: для прямого доступа к данным (если нужно)
 */
@Module({
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
