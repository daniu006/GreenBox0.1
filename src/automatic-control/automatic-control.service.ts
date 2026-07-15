import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { OpenMeteoService } from 'src/weather/open-meteo.service';

export interface SensorReading {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightHours: number;
  waterLevel: number;
}

export interface ControlCommand {
  pump: boolean;
  light: boolean;
  reason: string;
}

@Injectable()
export class AutomaticControlService {
  private readonly logger = new Logger(AutomaticControlService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openMeteoService: OpenMeteoService,
  ) { }

  async evaluate(
    userPlantId: number,
    reading: SensorReading,
  ): Promise<ControlCommand> {
    const userPlant = await this.prisma.userPlant.findUnique({
      where: { id: userPlantId },
      include: { plant: true, box: true },
    });

    if (!userPlant || !userPlant.plant) {
      throw new NotFoundException(`UserPlant ${userPlantId} no encontrado`);
    }

    if (userPlant.archivedAt !== null) {
      this.logger.warn(`UserPlant ${userPlantId} está archivada — sin control automático`);
      return { pump: false, light: false, reason: 'Planta archivada' };
    }

    const plant = userPlant.plant;
    const reasons: string[] = [];

    // ── 1. Evaluación base: suelo seco + agua disponible ──────────────────────
    const minSoil = plant.minSoilMoisture ?? 30;
    const soilDry = reading.soilMoisture < minSoil;
    const hasWater = reading.waterLevel > plant.minWaterLevel;
    let pump = soilDry && hasWater;

    // ── 2. Suspender bomba si está lloviendo en la ubicación del box ──────────
    if (pump) {
      const box = userPlant.box as any;
      if (box?.latitude && box?.longitude) {
        try {
          const weather = await this.openMeteoService.getCurrentWeather(
            box.latitude,
            box.longitude,
            box.locationName ?? 'Box',
          );
          const goodToWater = weather.isGoodForWatering();
          if (!goodToWater) {
            pump = false;
            reasons.push(
              `Riego suspendido por lluvia o calor extremo ` +
              `(clima: ${weather.weatherDesc}, ${weather.temperature}°C)`,
            );
            this.logger.warn(
              `[userPlant ${userPlantId}] Riego cancelado por clima: ` +
              `${weather.weatherDesc} (código ${weather.weatherCode})`,
            );
          } else {
            reasons.push(`Suelo seco (${reading.soilMoisture}% < ${minSoil}%) — activando bomba`);
          }
        } catch (e) {
          // Si falla la consulta del clima, regar igual (fail-safe)
          this.logger.warn(`[userPlant ${userPlantId}] No se pudo consultar el clima: ${e.message}`);
          reasons.push(`Suelo seco (${reading.soilMoisture}% < ${minSoil}%) — activando bomba (sin datos de clima)`);
        }
      } else {
        // Sin ubicación del box configurada → regar normalmente
        reasons.push(`Suelo seco (${reading.soilMoisture}% < ${minSoil}%) — activando bomba`);
      }
    } else if (soilDry && !hasWater) {
      reasons.push(`Suelo seco (${reading.soilMoisture}%) pero sin agua (${reading.waterLevel}%)`);
    }

    const reason = reasons.length > 0 ? reasons.join(' | ') : 'Todos los parámetros OK';
    this.logger.log(`[userPlant ${userPlantId}] pump: ${pump}, light: false — ${reason}`);

    return { pump, light: false, reason };
  }
}