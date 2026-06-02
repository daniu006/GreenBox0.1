import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { IStatisticRepository, UpsertStatisticData } from './domain/statistic.repository.interface';
import { Statistic } from './domain/statistic.entity';

@Injectable()
export class StatisticPrismaRepository implements IStatisticRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(raw: any): Statistic {
    return new Statistic(
      raw.id,
      raw.userPlantId,
      raw.week,
      raw.avgTemperature,
      raw.avgHumidity,
      raw.avgLightHours,
      raw.avgWaterLevel,
      raw.avgSoilMoisture,
      raw.estimatedHealth,
      raw.generatedAt,
    );
  }

  async upsert(data: UpsertStatisticData): Promise<Statistic> {
    const statistic = await this.prisma.statistic.upsert({
      where: {
        userPlantId_week: {
          userPlantId: data.userPlantId,
          week: data.week,
        },
      },
      update: {
        avgTemperature:  data.avgTemperature,
        avgHumidity:     data.avgHumidity,
        avgLightHours:   data.avgLightHours,
        avgWaterLevel:   data.avgWaterLevel,
        avgSoilMoisture: data.avgSoilMoisture,
        estimatedHealth: data.estimatedHealth,
        generatedAt:     new Date(),
      },
      create: {
        userPlantId:     data.userPlantId,
        week:            data.week,
        avgTemperature:  data.avgTemperature,
        avgHumidity:     data.avgHumidity,
        avgLightHours:   data.avgLightHours,
        avgWaterLevel:   data.avgWaterLevel,
        avgSoilMoisture: data.avgSoilMoisture,
        estimatedHealth: data.estimatedHealth,
      },
    });
    return this.toEntity(statistic);
  }

  async findLatest(userPlantId: number): Promise<Statistic | null> {
    const statistic = await this.prisma.statistic.findFirst({
      where: { userPlantId },
      orderBy: { generatedAt: 'desc' },
    });
    return statistic ? this.toEntity(statistic) : null;
  }

  async findByWeek(userPlantId: number, week: number): Promise<Statistic | null> {
    const statistic = await this.prisma.statistic.findUnique({
      where: { userPlantId_week: { userPlantId, week } },
    });
    return statistic ? this.toEntity(statistic) : null;
  }

  async findAll(userPlantId: number): Promise<Statistic[]> {
    const statistics = await this.prisma.statistic.findMany({
      where: { userPlantId },
      orderBy: { generatedAt: 'desc' },
    });
    return statistics.map(s => this.toEntity(s));
  }
}