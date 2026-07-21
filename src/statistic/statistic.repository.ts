import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

export interface Statistic {
  id: number;
  userPlantId: number;
  week: number;
  avgTemperature: number;
  avgHumidity: number;
  avgLightHours: number;
  avgWaterLevel: number;
  avgSoilMoisture: number;
  estimatedHealth: number;
  generatedAt: Date;
}

export interface UpsertStatisticData {
  userPlantId: number;
  week: number;
  avgTemperature: number;
  avgHumidity: number;
  avgLightHours: number;
  avgWaterLevel: number;
  avgSoilMoisture: number;
  estimatedHealth: number;
}

@Injectable()
export class StatisticRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(data: UpsertStatisticData): Promise<Statistic> {
    return this.prisma.statistic.upsert({
      where: {
        userPlantId_week: {
          userPlantId: data.userPlantId,
          week: data.week,
        },
      },
      update: {
        avgTemperature: data.avgTemperature,
        avgHumidity: data.avgHumidity,
        avgLightHours: data.avgLightHours,
        avgWaterLevel: data.avgWaterLevel,
        avgSoilMoisture: data.avgSoilMoisture,
        estimatedHealth: data.estimatedHealth,
        generatedAt: new Date(),
      },
      create: {
        userPlantId: data.userPlantId,
        week: data.week,
        avgTemperature: data.avgTemperature,
        avgHumidity: data.avgHumidity,
        avgLightHours: data.avgLightHours,
        avgWaterLevel: data.avgWaterLevel,
        avgSoilMoisture: data.avgSoilMoisture,
        estimatedHealth: data.estimatedHealth,
      },
    });
  }

  async findLatest(userPlantId: number): Promise<Statistic | null> {
    return this.prisma.statistic.findFirst({
      where: { userPlantId },
      orderBy: { generatedAt: 'desc' },
    });
  }

  async findByWeek(
    userPlantId: number,
    week: number,
  ): Promise<Statistic | null> {
    return this.prisma.statistic.findUnique({
      where: { userPlantId_week: { userPlantId, week } },
    });
  }

  async findAll(userPlantId: number): Promise<Statistic[]> {
    return this.prisma.statistic.findMany({
      where: { userPlantId },
      orderBy: { generatedAt: 'desc' },
    });
  }
}
