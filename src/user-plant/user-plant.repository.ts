import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { IUserPlantRepository, CreateUserPlantData } from './domain/user-plant.repository.interface';
import { UserPlant } from './domain/user-plant.entity';

@Injectable()
export class UserPlantPrismaRepository implements IUserPlantRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(raw: any): UserPlant {
    return new UserPlant(
      raw.id,
      raw.userId,
      raw.boxId,
      raw.plantId,
      raw.nickname,
      raw.status,
      raw.startedAt,
      raw.archivedAt,
      raw.createdAt,
      raw.plant ?? undefined,
    );
  }

  async create(data: CreateUserPlantData): Promise<UserPlant> {
    const userPlant = await this.prisma.userPlant.create({
      data: {
        userId: data.userId,
        boxId: data.boxId,
        plantId: data.plantId,
        nickname: data.nickname,
        status: 'active',
      },
      include: { plant: true },
    });
    return this.toEntity(userPlant);
  }

  async findById(id: number): Promise<UserPlant | null> {
    const userPlant = await this.prisma.userPlant.findUnique({
      where: { id },
      include: { plant: true },
    });
    return userPlant ? this.toEntity(userPlant) : null;
  }

  async findAllByUser(userId: string): Promise<UserPlant[]> {
    const userPlants = await this.prisma.userPlant.findMany({
      where: { userId },
      include: { plant: true },
      orderBy: { createdAt: 'desc' },
    });
    return userPlants.map(up => this.toEntity(up));
  }

  async findActiveByUser(userId: string): Promise<UserPlant[]> {
    const userPlants = await this.prisma.userPlant.findMany({
      where: { userId, archivedAt: null },
      include: { plant: true },
      orderBy: { startedAt: 'desc' },
    });
    return userPlants.map(up => this.toEntity(up));
  }

  async findActiveByBox(boxId: number, userId: string): Promise<UserPlant | null> {
    const userPlant = await this.prisma.userPlant.findFirst({
      where: { boxId, userId, archivedAt: null },
      include: { plant: true },
    });
    return userPlant ? this.toEntity(userPlant) : null;
  }

  async archive(id: number): Promise<UserPlant> {
    const userPlant = await this.prisma.userPlant.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        status: 'archived',
      },
      include: { plant: true },
    });
    return this.toEntity(userPlant);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.userPlant.delete({ where: { id } });
  }

  async belongsToUser(id: number, userId: string): Promise<boolean> {
    const count = await this.prisma.userPlant.count({
      where: { id, userId },
    });
    return count > 0;
  }
}