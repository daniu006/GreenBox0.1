import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { IUserRepository, UpdateUserData } from './domain/user.repository.interface';
import { User } from './domain/user.entity';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(raw: any): User {
    return new User(raw.id, raw.email, raw.name, raw.createdAt);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toEntity(user) : null;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.prisma.user.update({ where: { id }, data });
    return this.toEntity(user);
  }
}
