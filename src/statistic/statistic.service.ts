import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { StatisticRepository, Statistic } from './statistic.repository';

export interface StatisticFormatted extends Statistic {
  healthLabel: string;
}

@Injectable()
export class StatisticService {
  private readonly logger = new Logger(StatisticService.name);

  constructor(
    private readonly statisticRepository: StatisticRepository,
    private readonly prisma: PrismaService,
  ) {}

  async calculate(userPlantId: number): Promise<StatisticFormatted | null> {
    const userPlant = await this.prisma.userPlant.findUnique({
      where: { id: userPlantId },
      include: { plant: true },
    });
    if (!userPlant?.plant) {
      throw new NotFoundException(`UserPlant ${userPlantId} no encontrada`);
    }

    const dateEnd = new Date();
    const dateStart = new Date();
    dateStart.setDate(dateEnd.getDate() - 7);

    const readings = await this.prisma.reading.findMany({
      where: { userPlantId, timestamp: { gte: dateStart, lte: dateEnd } },
      orderBy: { timestamp: 'asc' },
    });

    if (readings.length === 0) {
      this.logger.warn(`Sin lecturas para calcular estadísticas de userPlant ${userPlantId}`);
      return null;
    }

    const plant = userPlant.plant;
    const count = readings.length;

    const avgTemperature  = readings.reduce((s, r) => s + r.temperature,  0) / count;
    const avgHumidity     = readings.reduce((s, r) => s + r.humidity,     0) / count;
    const avgLightHours   = readings.reduce((s, r) => s + r.lightHours,   0) / count;
    const avgWaterLevel   = readings.reduce((s, r) => s + r.waterLevel,   0) / count;
    const avgSoilMoisture = readings.reduce((s, r) => s + r.soilMoisture, 0) / count;

    const estimatedHealth = this.calculateHealth(
      avgTemperature, avgHumidity, avgWaterLevel,
      avgLightHours, avgSoilMoisture, plant,
    );

    const statistic = await this.statisticRepository.upsert({
      userPlantId,
      week: this.getWeekNumber(new Date()),
      avgTemperature:  parseFloat(avgTemperature.toFixed(2)),
      avgHumidity:     parseFloat(avgHumidity.toFixed(2)),
      avgLightHours:   parseFloat(avgLightHours.toFixed(2)),
      avgWaterLevel:   parseFloat(avgWaterLevel.toFixed(2)),
      avgSoilMoisture: parseFloat(avgSoilMoisture.toFixed(2)),
      estimatedHealth: parseFloat(estimatedHealth.toFixed(2)),
    });

    this.logger.log(`Estadísticas calculadas para userPlant ${userPlantId} — salud: ${estimatedHealth.toFixed(1)}%`);
    return this.format(statistic);
  }

  async getLatest(userPlantId: number): Promise<StatisticFormatted | null> {
    const statistic = await this.statisticRepository.findLatest(userPlantId);
    return statistic ? this.format(statistic) : null;
  }

  async getAll(userPlantId: number): Promise<StatisticFormatted[]> {
    const statistics = await this.statisticRepository.findAll(userPlantId);
    return statistics.map(s => this.format(s));
  }

  async getByWeek(userPlantId: number, week: number): Promise<StatisticFormatted | null> {
    const statistic = await this.statisticRepository.findByWeek(userPlantId, week);
    return statistic ? this.format(statistic) : null;
  }

  private format(statistic: Statistic): StatisticFormatted {
    return {
      ...statistic,
      healthLabel: this.getHealthLabel(statistic.estimatedHealth),
    };
  }

  private getHealthLabel(estimatedHealth: number): string {
    if (estimatedHealth >= 80) return 'Saludable';
    if (estimatedHealth >= 60) return 'Aceptable';
    if (estimatedHealth >= 40) return 'En riesgo';
    return 'Crítico';
  }

  private calculateHealth(
    avgTemperature: number,
    avgHumidity: number,
    avgWaterLevel: number,
    avgLightHours: number,
    avgSoilMoisture: number,
    plant: any,
  ): number {
    let tempScore: number;
    if (avgTemperature >= plant.minTemperature && avgTemperature <= plant.maxTemperature) {
      tempScore = 100;
    } else {
      const deviation = avgTemperature < plant.minTemperature
        ? plant.minTemperature - avgTemperature
        : avgTemperature - plant.maxTemperature;
      tempScore = Math.max(0, 100 - deviation * 10);
    }

    let humidityScore: number;
    if (avgHumidity >= plant.minHumidity && avgHumidity <= plant.maxHumidity) {
      humidityScore = 100;
    } else {
      const deviation = avgHumidity < plant.minHumidity
        ? plant.minHumidity - avgHumidity
        : avgHumidity - plant.maxHumidity;
      humidityScore = Math.max(0, 100 - deviation * 10);
    }

    const waterScore = avgWaterLevel >= plant.minWaterLevel
      ? 100 : Math.max(0, (avgWaterLevel / plant.minWaterLevel) * 100);
    const lightScore = Math.min(100, (avgLightHours / plant.lightHours) * 100);
    const minSoil = plant.minSoilMoisture ?? 30;
    const soilScore = avgSoilMoisture >= minSoil
      ? 100 : Math.max(0, (avgSoilMoisture / minSoil) * 100);

    return (
      tempScore     * 0.25 +
      humidityScore * 0.25 +
      waterScore    * 0.20 +
      lightScore    * 0.15 +
      soilScore     * 0.15
    );
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}