import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { GetUserUseCase } from './usecases/get-user.usecase';
import { UpdateUserUseCase } from './usecases/update-user.usecase';
import { UserPrismaRepository } from './user.repository';
import { USER_REPOSITORY } from './domain/user.repository.interface';

@Module({
  controllers: [UserController],
  providers: [
    GetUserUseCase,
    UpdateUserUseCase,
    UserPrismaRepository,
    {
      provide: USER_REPOSITORY,
      useClass: UserPrismaRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
