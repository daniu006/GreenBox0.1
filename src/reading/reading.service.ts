import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ReadingRepository, Reading } from './reading.repository';
import { AlertService } from 'src/alert/alert.service';
import { CreateReadingDto } from './reading.dto';

export type Period = 'day' | 'week' | 'month';

export interface ReadingWithCommands {
  reading: Reading;
  commands: { pump: boolean };
}

export interface PeriodPeaks {
  temperature:  { max: number; maxAt: Date; min: number; minAt: Date };
  humidity:     { max: number; maxAt: Date; min: number; minAt: Date };
  soilMoisture: { max: number; maxAt: Date; min: number; minAt: Date };
  waterLevel:   { max: number; maxAt: Date; min: number; minAt: Date };
}

export interface PeriodReadings {
  readings: Reading[];
  peaks: PeriodPeaks;
  total: number;
}

@Injectable()
export class ReadingService {
  private readonly logger = new Logger(ReadingService.name);

  constructor(
    private readonly readingRepository: ReadingRepository,
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
  ) {}

  async create(dto: CreateReadingDto): Promise<ReadingWithCommands> {
    const userPlant = await this.prisma.userPlant.findUnique({
      where: { id: dto.userPlantId },
      include: { plant: true },
    });

    if (!userPlant || !userPlant.plant) {
      throw new NotFoundException('Instancia de planta no encontrada');
    }
    if (userPlant.archivedAt !== null) {
      throw new NotFoundException('Esta planta está archivada');
    }

    const plant = userPlant.plant;
    const reading = await this.readingRepository.create({
      userPlantId: dto.userPlantId,
      temperature: dto.temperature,
      humidity: dto.humidity,
      soilMoisture: dto.soilMoisture,
      lightHours: dto.lightHours,
      waterLevel: dto.waterLevel,
    });

    const pumpOn = this.shouldActivatePump(dto, plant);
    await this.checkAndCreateAlerts(dto, plant, dto.userPlantId);

    this.logger.log(`Lectura creada para userPlant ${dto.userPlantId} — pump: ${pumpOn}`);
    return { reading, commands: { pump: pumpOn } };
  }

  async getLatest(userPlantId: number): Promise<Reading | null> {
    return this.readingRepository.findLatest(userPlantId);
  }

  async getByPeriod(
    userPlantId: number,
    period: Period,
    dateStr?: string,
  ): Promise<PeriodReadings> {
    const validPeriods: Period[] = ['day', 'week', 'month'];
    if (!validPeriods.includes(period)) {
      throw new BadRequestException('Período inválido. Use: day, week o month');
    }

    const refDate = dateStr ? new Date(dateStr) : new Date();
    let readings: Reading[] = [];

    if (period === 'day') {
      readings = await this.readingRepository.findByDay(userPlantId, refDate);
    } else if (period === 'week') {
      const start = this.getWeekStart(refDate);
      const end = this.getWeekEnd(refDate);
      readings = await this.readingRepository.findByWeek(userPlantId, start, end);
    } else if (period === 'month') {
      readings = await this.readingRepository.findByMonth(
        userPlantId,
        refDate.getFullYear(),
        refDate.getMonth() + 1,
      );
    }

    return {
      readings,
      peaks: this.calculatePeaks(readings),
      total: readings.length,
    };
  }

  private shouldActivatePump(reading: CreateReadingDto, plant: any): boolean {
    const soilTooLow = reading.soilMoisture < (plant.minSoilMoisture ?? 30);
    const waterTooLow = reading.waterLevel < plant.minWaterLevel;
    return soilTooLow && !waterTooLow;
  }

  private async checkAndCreateAlerts(
    reading: CreateReadingDto,
    plant: any,
    userPlantId: number,
  ): Promise<void> {
    const checks = [
      {
        condition: reading.temperature < plant.minTemperature || reading.temperature > plant.maxTemperature,
        type: 'temperature',
        message: `Temperatura fuera de rango: ${reading.temperature}°C (óptimo: ${plant.minTemperature}-${plant.maxTemperature}°C)`,
      },
      {
        condition: reading.humidity < plant.minHumidity || reading.humidity > plant.maxHumidity,
        type: 'humidity',
        message: `Humedad fuera de rango: ${reading.humidity}% (óptimo: ${plant.minHumidity}-${plant.maxHumidity}%)`,
      },
      {
        condition: reading.waterLevel < plant.minWaterLevel,
        type: 'water',
        message: `Nivel de agua bajo: ${reading.waterLevel}% (mínimo: ${plant.minWaterLevel}%)`,
      },
      {
        condition: plant.minSoilMoisture && reading.soilMoisture < plant.minSoilMoisture,
        type: 'soilMoisture',
        message: `Humedad del suelo baja: ${reading.soilMoisture}% (mínimo: ${plant.minSoilMoisture}%)`,
      },
    ];

    for (const check of checks) {
      if (!check.condition) continue;
      await this.alertService.create(userPlantId, check.type, check.message);
    }
  }

  private calculatePeaks(readings: Reading[]): PeriodPeaks {
    if (readings.length === 0) {
      const empty = { max: 0, maxAt: new Date(), min: 0, minAt: new Date() };
      return { temperature: empty, humidity: empty, soilMoisture: empty, waterLevel: empty };
    }

    const findPeaks = (getValue: (r: Reading) => number) => {
      const maxR = readings.reduce((a, b) => getValue(a) > getValue(b) ? a : b);
      const minR = readings.reduce((a, b) => getValue(a) < getValue(b) ? a : b);
      return {
        max: getValue(maxR),
        maxAt: maxR.timestamp,
        min: getValue(minR),
        minAt: minR.timestamp,
      };
    };

    return {
      temperature:  findPeaks(r => r.temperature),
      humidity:     findPeaks(r => r.humidity),
      soilMoisture: findPeaks(r => r.soilMoisture),
      waterLevel:   findPeaks(r => r.waterLevel),
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getWeekEnd(date: Date): Date {
    const start = this.getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}