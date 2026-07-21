import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(
    id: string,
    email: string,
    name: string,
    password: string,
  ): Promise<AuthUser> {
    return this.prisma.user.create({
      data: { id, email, name, password },
    });
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }
}
