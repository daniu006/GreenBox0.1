import { User } from './user.entity';
import { UpdateUserDto } from '../user.dto';

export interface IUserUseCase {
  getMe(uid: string): Promise<User>;
  updateMe(uid: string, dto: UpdateUserDto): Promise<User>;
}

export const USER_USE_CASE = 'USER_USE_CASE';