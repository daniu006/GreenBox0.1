import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AlertService } from 'src/alert/alert.service';
import { AutomaticControlService } from 'src/automatic-control/automatic-control.service';
import { ReadingService } from 'src/reading/reading.service';
import { SensorDataWsDto } from 'src/reading/reading.dto';
import { WebSocketGateway } from './websocket.gateway';
import { SensorsService } from 'src/sensors/sensors.service';

export interface SensorPayload {
  userPlantId: number;
  boxId: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightHours: number;
  waterLevel: number;
  timestamp: Date;
}

export interface CommandPayload {
  userPlantId: number;
  boxId: number;
  pump: boolean;
  light: boolean;
  reason: string;
}

interface AccumulatedEntry {
  userPlantId: number;
  readings: {
    temperature: number;
    humidity: number;
    soilMoisture: number;
    lightHours: number;
    waterLevel: number;
  }[];
}

const AVERAGE_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos

@Injectable()
export class WebsocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebsocketService.name);
  private accumulated = new Map<number, AccumulatedEntry>();
  private averagingTimer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(forwardRef(() => WebSocketGateway))
    private readonly gateway: WebSocketGateway,
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
    private readonly automaticControlService: AutomaticControlService,
    private readonly readingService: ReadingService,
    private readonly sensorsService: SensorsService,
  ) {}

  onModuleInit(): void {
    this.averagingTimer = setInterval(
      () => void this.flushAverages(),
      AVERAGE_INTERVAL_MS,
    );
    this.logger.log(
      `[Timer] Promedio cada ${AVERAGE_INTERVAL_MS / 60000} min iniciado`,
    );
  }

  onModuleDestroy(): void {
    if (this.averagingTimer) {
      clearInterval(this.averagingTimer);
      this.averagingTimer = null;
    }
  }
  async handleSensorData(data: SensorDataWsDto): Promise<void> {
    const userPlant = await this.prisma.userPlant.findFirst({
      where: { boxId: data.boxId, archivedAt: null },
      include: { plant: true },
    });

    if (!userPlant || !userPlant.plant) {
      this.logger.warn(
        `[WS] sensor:data ignorado — sin planta activa para box ${data.boxId}`,
      );
      return;
    }

    const { id: userPlantId, plant } = userPlant;
    const timestamp = new Date();

    const sensorPayload: SensorPayload = {
      userPlantId,
      boxId: data.boxId,
      temperature: data.temperature,
      humidity: data.humidity,
      soilMoisture: data.soilMoisture,
      lightHours: data.lightHours,
      waterLevel: data.waterLevel,
      timestamp,
    };
    this.emitReading(sensorPayload);

    await this.checkAndCreateAlerts(data, plant, userPlantId);

    const command = await this.automaticControlService.evaluate(userPlantId, {
      temperature: data.temperature,
      humidity: data.humidity,
      soilMoisture: data.soilMoisture,
      lightHours: data.lightHours,
      waterLevel: data.waterLevel,
    });

    const currentState = this.sensorsService.getActuatorStatus(data.boxId);
    let newWateringCount = currentState?.wateringCount ?? 0;
    let newLastWateringDate = currentState?.lastWateringDate ?? null;

    if (command.pump) {
      if (!currentState?.pump) {
        newWateringCount += 1;
      }
      newLastWateringDate = new Date().toISOString();
    }

    this.sensorsService.setActuatorStatus(data.boxId, {
      boxId: data.boxId,
      boxName:
        userPlant.nickname ?? userPlant.plant.name ?? `Caja ${data.boxId}`,
      led: command.light,
      pump: command.pump,
      wateringCount: newWateringCount,
      lastWateringDate: newLastWateringDate,
    });

    this.emitCommand({
      userPlantId,
      boxId: data.boxId,
      pump: command.pump,
      light: command.light,
      reason: command.reason,
    });

    this.accumulate(data.boxId, userPlantId, data);

    this.logger.log(
      `[WS] sensor:data procesado — userPlant ${userPlantId} (box ${data.boxId}) pump:${command.pump} light:${command.light}`,
    );
  }

  emitReading(payload: SensorPayload): void {
    this.gateway.emitToRoom(
      `plant:${payload.userPlantId}`,
      'reading:new',
      payload,
    );
    this.logger.log(`[WS] reading:new → room plant:${payload.userPlantId}`);
  }

  emitCommand(payload: CommandPayload): void {
    this.gateway.emitToRoom(
      `plant:${payload.userPlantId}`,
      'command:control',
      payload,
    );
    this.logger.log(
      `[WS] command:control → room plant:${payload.userPlantId} — pump:${payload.pump} light:${payload.light}`,
    );
  }

  private accumulate(
    boxId: number,
    userPlantId: number,
    data: SensorDataWsDto,
  ): void {
    const entry = this.accumulated.get(boxId) ?? {
      userPlantId,
      readings: [],
    };

    entry.readings.push({
      temperature: data.temperature,
      humidity: data.humidity,
      soilMoisture: data.soilMoisture,
      lightHours: data.lightHours,
      waterLevel: data.waterLevel,
    });

    this.accumulated.set(boxId, entry);
  }

  private async flushAverages(): Promise<void> {
    if (this.accumulated.size === 0) {
      this.logger.log('[Timer] Sin lecturas acumuladas — nada que guardar');
      return;
    }

    const snapshot = new Map(this.accumulated);
    this.accumulated.clear();

    for (const [boxId, entry] of snapshot) {
      try {
        const avg = this.calculateAverage(entry.readings);
        await this.readingService.create(avg, boxId);
        this.logger.log(
          `[Timer] Promedio guardado en DB — box ${boxId} (${entry.readings.length} lecturas)`,
        );
      } catch (error) {
        this.logger.error(
          `[Timer] Error guardando promedio para box ${boxId}`,
          error,
        );
      }
    }
  }

  private calculateAverage(readings: AccumulatedEntry['readings']): {
    temperature: number;
    humidity: number;
    soilMoisture: number;
    lightHours: number;
    waterLevel: number;
  } {
    const count = readings.length;
    const sum = readings.reduce(
      (acc, r) => ({
        temperature: acc.temperature + r.temperature,
        humidity: acc.humidity + r.humidity,
        soilMoisture: acc.soilMoisture + r.soilMoisture,
        lightHours: acc.lightHours + r.lightHours,
        waterLevel: acc.waterLevel + r.waterLevel,
      }),
      {
        temperature: 0,
        humidity: 0,
        soilMoisture: 0,
        lightHours: 0,
        waterLevel: 0,
      },
    );

    return {
      temperature: Math.round((sum.temperature / count) * 100) / 100,
      humidity: Math.round((sum.humidity / count) * 100) / 100,
      soilMoisture: Math.round((sum.soilMoisture / count) * 100) / 100,
      lightHours: Math.round((sum.lightHours / count) * 100) / 100,
      waterLevel: Math.round((sum.waterLevel / count) * 100) / 100,
    };
  }

  private async checkAndCreateAlerts(
    data: SensorDataWsDto,
    plant: any,
    userPlantId: number,
  ): Promise<void> {
    const checks = [
      {
        condition:
          data.temperature < plant.minTemperature ||
          data.temperature > plant.maxTemperature,
        type: 'temperature',
        message: `Temperatura fuera de rango: ${data.temperature}°C (óptimo: ${plant.minTemperature}-${plant.maxTemperature}°C)`,
      },
      {
        condition:
          data.humidity < plant.minHumidity ||
          data.humidity > plant.maxHumidity,
        type: 'humidity',
        message: `Humedad fuera de rango: ${data.humidity}% (óptimo: ${plant.minHumidity}-${plant.maxHumidity}%)`,
      },
      {
        condition: data.waterLevel < plant.minWaterLevel,
        type: 'water',
        message: `Nivel de agua bajo: ${data.waterLevel}% (mínimo: ${plant.minWaterLevel}%)`,
      },
      {
        condition:
          plant.minSoilMoisture && data.soilMoisture < plant.minSoilMoisture,
        type: 'soilMoisture',
        message: `Humedad del suelo baja: ${data.soilMoisture}% (mínimo: ${plant.minSoilMoisture}%)`,
      },
    ];

    for (const check of checks) {
      if (!check.condition) continue;
      await this.alertService.create(userPlantId, check.type, check.message);
    }
  }
}
