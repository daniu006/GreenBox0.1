import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

export interface Alert {
  id: number;
  userPlantId: number;
  type: string;
  message: string;
  resolved: boolean;
  createdAt: Date;
}

export const ALERT_TYPES = [
  'temperature',
  'humidity',
  'water',
  'soilMoisture',
  'light',
] as const;

export type AlertType = (typeof ALERT_TYPES)[number];

@Injectable()
export class AlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userPlantId: number,
    type: string,
    message: string,
  ): Promise<Alert> {
    return this.prisma.alert.create({
      data: { userPlantId, type, message },
    });
  }

  async findActive(userPlantId: number): Promise<Alert[]> {
    return this.prisma.alert.findMany({
      where: { userPlantId, resolved: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(userPlantId: number): Promise<Alert[]> {
    return this.prisma.alert.findMany({
      where: { userPlantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number): Promise<Alert | null> {
    return this.prisma.alert.findUnique({ where: { id } });
  }

  async findUnresolved(
    userPlantId: number,
    type: string,
  ): Promise<Alert | null> {
    return this.prisma.alert.findFirst({
      where: { userPlantId, type, resolved: false },
    });
  }

  async resolve(id: number): Promise<Alert> {
    return this.prisma.alert.update({
      where: { id },
      data: { resolved: true },
    });
  }

  async resolveAll(userPlantId: number): Promise<void> {
    await this.prisma.alert.updateMany({
      where: { userPlantId, resolved: false },
      data: { resolved: true },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.alert.delete({ where: { id } });
  }
}
