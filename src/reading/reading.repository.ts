import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { IReadingRepository, CreateReadingData } from './domain/reading.repository.interface';
import { Reading } from './domain/reading.entity';

@Injectable()
export class ReadingPrismaRepository implements IReadingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(raw: any): Reading {
    return new Reading(
      raw.id,
      raw.userPlantId,
      raw.temperature,
      raw.humidity,
      raw.soilMoisture,
      raw.lightHours,
      raw.waterLevel,
      raw.timestamp,
    );
  }

  async create(data: CreateReadingData): Promise<Reading> {
    const reading = await this.prisma.reading.create({ data });
    return this.toEntity(reading);
  }

  async findLatest(userPlantId: number): Promise<Reading | null> {
    const reading = await this.prisma.reading.findFirst({
      where: { userPlantId },
      orderBy: { timestamp: 'desc' },
    });
    return reading ? this.toEntity(reading) : null;
  }

  async findByDay(userPlantId: number, date: Date): Promise<Reading[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const readings = await this.prisma.reading.findMany({
      where: { userPlantId, timestamp: { gte: start, lte: end } },
      orderBy: { timestamp: 'asc' },
    });
    return readings.map(r => this.toEntity(r));
  }

  async findByWeek(userPlantId: number, startDate: Date, endDate: Date): Promise<Reading[]> {
    const readings = await this.prisma.reading.findMany({
      where: { userPlantId, timestamp: { gte: startDate, lte: endDate } },
      orderBy: { timestamp: 'asc' },
    });
    return readings.map(r => this.toEntity(r));
  }

  async findByMonth(userPlantId: number, year: number, month: number): Promise<Reading[]> {
    const start = new Date(year, month - 1, 1, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59);

    const readings = await this.prisma.reading.findMany({
      where: { userPlantId, timestamp: { gte: start, lte: end } },
      orderBy: { timestamp: 'asc' },
    });
    return readings.map(r => this.toEntity(r));
  }

  async findByPeriod(userPlantId: number, startDate: Date, endDate: Date): Promise<Reading[]> {
    const readings = await this.prisma.reading.findMany({
      where: { userPlantId, timestamp: { gte: startDate, lte: endDate } },
      orderBy: { timestamp: 'asc' },
    });
    return readings.map(r => this.toEntity(r));
  }
}