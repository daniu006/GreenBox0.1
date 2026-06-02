import { AuthUser } from './auth.entity';

export interface IAuthRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  create(id: string, email: string, name: string, password: string): Promise<AuthUser>;
  emailExists(email: string): Promise<boolean>;
}

export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';