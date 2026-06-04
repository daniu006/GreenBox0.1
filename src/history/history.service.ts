import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { HistoryRepository, History, HistoryType, HISTORY_TYPES } from './history.repository';

export interface HistoryPeaks {
  temperature: { max: number; maxAt: Date; min: number; minAt: Date };
  humidity: { max: number; maxAt: Date; min: number; minAt: Date };
  health: { max: number; maxAt: Date; min: number; minAt: Date };
}

export interface HistoryWithPeaks {
  records: (History & { healthLabel: string; xLabel: string })[];
  peaks: HistoryPeaks;
  total: number;
}

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    private readonly historyRepository: HistoryRepository,
    private readonly prisma: PrismaService,
  ) { }

  async save(userPlantId: number, type: HistoryType): Promise<History & { healthLabel: string }> {
    const userPlant = await this.prisma.userPlant.findUnique({
      where: { id: userPlantId },
      include: { plant: true },
    });
    if (!userPlant?.plant) {
      throw new NotFoundException(`UserPlant ${userPlantId} no encontrada`);
    }

    const { startDate, endDate } = this.getDateRange(type);
    const readings = await this.prisma.reading.findMany({
      where: { userPlantId, timestamp: { gte: startDate, lte: endDate } },
    });

    if (readings.length === 0) {
      this.logger.warn(`Sin lecturas para guardar historial ${type} de userPlant ${userPlantId}`);
      throw new NotFoundException('No hay lecturas suficientes para guardar el historial');
    }

    const count = readings.length;
    const avgTemperature = readings.reduce((s, r) => s + r.temperature, 0) / count;
    const avgHumidity = readings.reduce((s, r) => s + r.humidity, 0) / count;
    const avgSoilMoisture = readings.reduce((s, r) => s + r.soilMoisture, 0) / count;
    const avgLightHours = readings.reduce((s, r) => s + r.lightHours, 0) / count;
    const avgWaterLevel = readings.reduce((s, r) => s + r.waterLevel, 0) / count;

    const estimatedHealth = this.calculateHealth(
      avgTemperature, avgHumidity, avgWaterLevel,
      avgLightHours, avgSoilMoisture, userPlant.plant,
    );

    const history = await this.historyRepository.save({
      userPlantId,
      type,
      week: this.getWeekNumber(new Date()),
      temperature: parseFloat(avgTemperature.toFixed(2)),
      humidity: parseFloat(avgHumidity.toFixed(2)),
      soilMoisture: parseFloat(avgSoilMoisture.toFixed(2)),
      lightHours: parseFloat(avgLightHours.toFixed(2)),
      waterLevel: parseFloat(avgWaterLevel.toFixed(2)),
      estimatedHealth: parseFloat(estimatedHealth.toFixed(2)),
    });

    this.logger.log(`Historial ${type} guardado para userPlant ${userPlantId}`);
    return { ...history, healthLabel: this.getHealthLabel(history.estimatedHealth) };
  }

  async getByPeriod(
    userPlantId: number,
    period: string,
    dateStr?: string,
  ): Promise<HistoryWithPeaks> {
    if (!HISTORY_TYPES.includes(period as HistoryType)) {
      throw new BadRequestException(`Período inválido. Use: ${HISTORY_TYPES.join(', ')}`);
    }

    const refDate = dateStr ? new Date(dateStr) : new Date();
    let records: History[] = [];

    if (period === 'daily') {
      records = await this.historyRepository.findByDay(userPlantId, refDate);
    } else if (period === 'weekly') {
      records = await this.historyRepository.findByWeek(userPlantId, this.getWeekNumber(refDate));
    } else if (period === 'monthly') {
      records = await this.historyRepository.findByMonth(
        userPlantId,
        refDate.getFullYear(),
        refDate.getMonth() + 1,
      );
    }

    return {
      records: records.map(r => ({
        ...r,
        healthLabel: this.getHealthLabel(r.estimatedHealth),
        xLabel: this.getXLabel(r.date, period),
      })),
      peaks: this.calculatePeaks(records),
      total: records.length,
    };
  }

  private getHealthLabel(estimatedHealth: number): string {
    if (estimatedHealth >= 80) return 'Saludable';
    if (estimatedHealth >= 60) return 'Aceptable';
    if (estimatedHealth >= 40) return 'En riesgo';
    return 'Crítico';
  }

  private getXLabel(date: Date, period: string): string {
    if (period === 'daily') {
      return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    } else if (period === 'weekly') {
      return date.toLocaleDateString('es-EC', { weekday: 'short', day: '2-digit' })
        + ' ' + date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
    }
  }

  private calculatePeaks(records: History[]): HistoryPeaks {
    if (records.length === 0) {
      const empty = { max: 0, maxAt: new Date(), min: 0, minAt: new Date() };
      return { temperature: empty, humidity: empty, health: empty };
    }

    const findPeaks = (getValue: (r: History) => number) => {
      const maxR = records.reduce((a, b) => getValue(a) > getValue(b) ? a : b);
      const minR = records.reduce((a, b) => getValue(a) < getValue(b) ? a : b);
      return {
        max: parseFloat(getValue(maxR).toFixed(2)),
        maxAt: maxR.date,
        min: parseFloat(getValue(minR).toFixed(2)),
        minAt: minR.date,
      };
    };

    return {
      temperature: findPeaks(r => r.temperature),
      humidity: findPeaks(r => r.humidity),
      health: findPeaks(r => r.estimatedHealth),
    };
  }

  private getDateRange(type: HistoryType): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    if (type === 'daily') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (type === 'weekly') {
      startDate.setDate(endDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (type === 'monthly') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }
    return { startDate, endDate };
  }

  private calculateHealth(
    avgTemperature: number,
    avgHumidity: number,
    avgWaterLevel: number,
    avgLightHours: number,
    avgSoilMoisture: number,
    plant: any,
  ): number {
    const tempScore = avgTemperature >= plant.minTemperature && avgTemperature <= plant.maxTemperature
      ? 100 : Math.max(0, 100 - Math.abs(avgTemperature - (plant.minTemperature + plant.maxTemperature) / 2) * 10);
    const humidityScore = avgHumidity >= plant.minHumidity && avgHumidity <= plant.maxHumidity
      ? 100 : Math.max(0, 100 - Math.abs(avgHumidity - (plant.minHumidity + plant.maxHumidity) / 2) * 10);
    const waterScore = avgWaterLevel >= plant.minWaterLevel
      ? 100 : Math.max(0, (avgWaterLevel / plant.minWaterLevel) * 100);
    const lightScore = Math.min(100, (avgLightHours / plant.lightHours) * 100);
    const minSoil = plant.minSoilMoisture ?? 30;
    const soilScore = avgSoilMoisture >= minSoil
      ? 100 : Math.max(0, (avgSoilMoisture / minSoil) * 100);

    return (
      tempScore * 0.25 +
      humidityScore * 0.25 +
      waterScore * 0.20 +
      lightScore * 0.15 +
      soilScore * 0.15
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