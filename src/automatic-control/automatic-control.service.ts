import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { EvaluateReadingUseCase } from './usecases/evaluate-reading.usecase';
import { SensorReading } from './domain/automatic-control.entity';
import { NotFoundException } from '@nestjs/common';
@Injectable()
export class AutomaticControlService {
  private readonly logger = new Logger(AutomaticControlService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluateReadingUseCase: EvaluateReadingUseCase,
  ) {}
  async evaluate(
    userPlantId: number,
    reading: SensorReading,
  ): Promise<{ pump: boolean; light: boolean; reason: string }> {
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
    const { plant } = userPlant;
    const thresholds = {
      minTemperature:  plant.minTemperature,
      maxTemperature:  plant.maxTemperature,
      minHumidity:     plant.minHumidity,
      maxHumidity:     plant.maxHumidity,
      lightHours:      plant.lightHours,
      minWaterLevel:   plant.minWaterLevel,
      minSoilMoisture: plant.minSoilMoisture,
    };
    const command = this.evaluateReadingUseCase.execute(
      userPlantId,
      reading,
      thresholds,
    );
    return {
      pump:   command.pump,
      light:  command.light,
      reason: command.summary(),
    };
  }
}
