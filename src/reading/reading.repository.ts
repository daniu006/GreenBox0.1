import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

export interface Reading {
  id: number;
  userPlantId: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightHours: number;
  waterLevel: number;
  timestamp: Date;
}

export interface CreateReadingData {
  userPlantId: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightHours: number;
  waterLevel: number;
}

@Injectable()
export class ReadingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateReadingData): Promise<Reading> {
    return this.prisma.reading.create({ data });
  }

  async findLatest(userPlantId: number): Promise<Reading | null> {
    return this.prisma.reading.findFirst({
      where: { userPlantId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByDay(userPlantId: number, date: Date): Promise<Reading[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return this.prisma.reading.findMany({
      where: { userPlantId, timestamp: { gte: start, lte: end } },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findByWeek(userPlantId: number, startDate: Date, endDate: Date): Promise<Reading[]> {
    return this.prisma.reading.findMany({
      where: { userPlantId, timestamp: { gte: startDate, lte: endDate } },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findByMonth(userPlantId: number, year: number, month: number): Promise<Reading[]> {
    const start = new Date(year, month - 1, 1, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59);
    return this.prisma.reading.findMany({
      where: { userPlantId, timestamp: { gte: start, lte: end } },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findByPeriod(userPlantId: number, startDate: Date, endDate: Date): Promise<Reading[]> {
    return this.prisma.reading.findMany({
      where: { userPlantId, timestamp: { gte: startDate, lte: endDate } },
      orderBy: { timestamp: 'asc' },
    });
  }
}