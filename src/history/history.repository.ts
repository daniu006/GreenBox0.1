import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

export interface History {
  id: number;
  userPlantId: number;
  type: string;
  week: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightHours: number;
  waterLevel: number;
  estimatedHealth: number;
  date: Date;
}

export const HISTORY_TYPES = ['daily', 'weekly', 'monthly'] as const;
export type HistoryType = typeof HISTORY_TYPES[number];

export interface SaveHistoryData {
  userPlantId: number;
  type: HistoryType;
  week: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightHours: number;
  waterLevel: number;
  estimatedHealth: number;
}

@Injectable()
export class HistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: SaveHistoryData): Promise<History> {
    return this.prisma.history.create({ data });
  }

  async findByDay(userPlantId: number, date: Date): Promise<History[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return this.prisma.history.findMany({
      where: { userPlantId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });
  }

  async findByWeek(userPlantId: number, week: number): Promise<History[]> {
    return this.prisma.history.findMany({
      where: { userPlantId, week },
      orderBy: { date: 'asc' },
    });
  }

  async findByMonth(userPlantId: number, year: number, month: number): Promise<History[]> {
    const start = new Date(year, month - 1, 1, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59);
    return this.prisma.history.findMany({
      where: { userPlantId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });
  }

  async findLatest(userPlantId: number): Promise<History | null> {
    return this.prisma.history.findFirst({
      where: { userPlantId },
      orderBy: { date: 'desc' },
    });
  }
}