import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

export interface UserPlant {
  id: number;
  userId: string;
  boxId: number;
  plantId: number;
  nickname: string | null;
  status: string;
  startedAt: Date;
  archivedAt: Date | null;
  createdAt: Date;
  plant?: {
    id: number;
    name: string;
    category: string;
    imageUrl: string | null;
    minTemperature: number;
    maxTemperature: number;
    minHumidity: number;
    maxHumidity: number;
    lightHours: number;
    minWaterLevel: number;
    minSoilMoisture: number | null;
    wateringFrequency: number;
  };
}

export interface CreateUserPlantData {
  userId: string;
  boxId: number;
  plantId: number;
  nickname?: string;
}

@Injectable()
export class UserPlantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserPlantData): Promise<UserPlant> {
    return this.prisma.userPlant.create({
      data: {
        userId: data.userId,
        boxId: data.boxId,
        plantId: data.plantId,
        nickname: data.nickname,
        status: 'active',
      },
      include: { plant: true },
    });
  }

  async findById(id: number): Promise<UserPlant | null> {
    return this.prisma.userPlant.findUnique({
      where: { id },
      include: { plant: true },
    });
  }

  async findAllByUser(userId: string): Promise<UserPlant[]> {
    return this.prisma.userPlant.findMany({
      where: { userId },
      include: { plant: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByUser(userId: string): Promise<UserPlant[]> {
    return this.prisma.userPlant.findMany({
      where: { userId, archivedAt: null },
      include: { plant: true },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findActiveByBox(
    boxId: number,
    userId: string,
  ): Promise<UserPlant | null> {
    return this.prisma.userPlant.findFirst({
      where: { boxId, userId, archivedAt: null },
      include: { plant: true },
    });
  }

  async archive(id: number): Promise<UserPlant> {
    return this.prisma.userPlant.update({
      where: { id },
      data: { archivedAt: new Date(), status: 'archived' },
      include: { plant: true },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.userPlant.delete({ where: { id } });
  }

  async belongsToUser(id: number, userId: string): Promise<boolean> {
    const count = await this.prisma.userPlant.count({ where: { id, userId } });
    return count > 0;
  }
}
