import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) { }

  async evaluate(
    userPlantId: number,
    reading: SensorReading,
  ): Promise<ControlCommand> {
    const userPlant = await this.prisma.userPlant.findUnique({
      where: { id: userPlantId },
      include: { plant: true },
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

    const minSoil = plant.minSoilMoisture ?? 30;
    const soilDry = reading.soilMoisture < minSoil;
    const hasWater = reading.waterLevel > plant.minWaterLevel;
    const pump = soilDry && hasWater;

    if (soilDry && !hasWater) {
      reasons.push(`Suelo seco (${reading.soilMoisture}%) pero sin agua (${reading.waterLevel}%)`);
    } else if (pump) {
      reasons.push(`Suelo seco (${reading.soilMoisture}% < ${minSoil}%) — activando bomba`);
    }

    const light = reading.lightHours < plant.lightHours;
    if (light) {
      reasons.push(`Luz insuficiente (${reading.lightHours}h de ${plant.lightHours}h requeridas)`);
    }

    const reason = reasons.length > 0 ? reasons.join(' | ') : 'Todos los parámetros OK';

    this.logger.log(`[userPlant ${userPlantId}] pump: ${pump}, light: ${light} — ${reason}`);

    return { pump, light, reason };
  }
}