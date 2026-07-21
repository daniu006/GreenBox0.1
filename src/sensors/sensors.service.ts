import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ReadingService, Period } from 'src/reading/reading.service';

export interface ActuatorState {
  boxId: number;
  boxName: string;
  led: boolean;
  pump: boolean;
  wateringCount: number;
  lastWateringDate: string | null;
}

@Injectable()
export class SensorsService {
  private actuatorStates = new Map<number, ActuatorState>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly readingService: ReadingService,
  ) {}

  async getLatest(boxId: number) {
    const userPlant = await this.prisma.userPlant.findFirst({
      where: { boxId, archivedAt: null },
    });

    if (!userPlant) {
      throw new NotFoundException('No hay planta activa para este dispositivo');
    }

    const latest = await this.readingService.getLatest(userPlant.id);
    if (!latest) {
      return {
        temp: 0,
        hum: 0,
        light: 0,
        water: 0,
        soilMoisture: 0,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      temp: latest.temperature,
      hum: latest.humidity,
      light: latest.lightHours,
      water: latest.waterLevel,
      soilMoisture: latest.soilMoisture,
      timestamp: latest.timestamp.toISOString(),
    };
  }

  async getHistory(boxId: number, period: string) {
    const userPlant = await this.prisma.userPlant.findFirst({
      where: { boxId, archivedAt: null },
    });

    if (!userPlant) {
      return [];
    }

    // Map frontend '24h' | '7d' | '30d' to backend 'day' | 'week' | 'month'
    let mappedPeriod: Period = 'week';
    if (period === '24h') mappedPeriod = 'day';
    else if (period === '7d') mappedPeriod = 'week';
    else if (period === '30d') mappedPeriod = 'month';
    else {
      throw new BadRequestException('Período inválido. Use 24h, 7d o 30d');
    }

    const result = await this.readingService.getByPeriod(
      userPlant.id,
      mappedPeriod,
    );

    return result.readings.map((r) => ({
      timestamp: r.timestamp.toISOString(),
      temperature: r.temperature,
      humidity: r.humidity,
      light: r.lightHours,
      water: r.waterLevel,
      soilMoisture: r.soilMoisture,
    }));
  }

  getActuatorStatus(boxId: number): ActuatorState {
    const state = this.actuatorStates.get(boxId);
    if (state) return state;

    return {
      boxId,
      boxName: `Caja ${boxId}`,
      led: false,
      pump: false,
      wateringCount: 0,
      lastWateringDate: null,
    };
  }

  setActuatorStatus(boxId: number, state: ActuatorState) {
    this.actuatorStates.set(boxId, state);
  }
}
