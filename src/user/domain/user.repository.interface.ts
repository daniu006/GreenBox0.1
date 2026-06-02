import { User } from './user.entity';

export interface UpdateUserData {
  name?: string;
  email?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  update(id: string, data: UpdateUserData): Promise<User>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
