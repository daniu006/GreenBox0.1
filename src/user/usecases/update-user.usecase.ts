import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';
import { UpdateUserDto } from '../user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(uid: string, dto: UpdateUserDto): Promise<User> {
    return this.userRepository.update(uid, { name: dto.name });
  }
}
