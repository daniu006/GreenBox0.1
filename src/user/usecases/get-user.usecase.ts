import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(uid: string): Promise<User> {
    const user = await this.userRepository.findById(uid);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
