import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository, User } from './user.repository';
import { UpdateUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getMe(uid: string): Promise<User> {
    const user = await this.userRepository.findById(uid);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateMe(uid: string, dto: UpdateUserDto): Promise<User> {
    return this.userRepository.update(uid, { name: dto.name });
  }
}
