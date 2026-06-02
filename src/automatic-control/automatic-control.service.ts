import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { EvaluateReadingUseCase } from './usecases/evaluate-reading.usecase';
import { SensorReading } from './domain/automatic-control.entity';
import { NotFoundException } from '@nestjs/common';

/**
 * AutomaticControlService
 *
 * Orquesta la evaluación de una lectura de sensores para un userPlant específico.
 * Recupera los umbrales de la planta desde la BD y delega la lógica de decisión
 * al EvaluateReadingUseCase.
 *
 * Es el punto de entrada desde el ReadingModule cuando llega una lectura del ESP32.
 */
@Injectable()
export class AutomaticControlService {
  private readonly logger = new Logger(AutomaticControlService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluateReadingUseCase: EvaluateReadingUseCase,
  ) {}

  /**
   * Evalúa una lectura de sensores y retorna los comandos de actuadores.
   * Los umbrales vienen de la BD — nunca del cliente.
   */
  async evaluate(
    userPlantId: number,
    reading: SensorReading,
  ): Promise<{ pump: boolean; light: boolean; reason: string }> {
    // 1. Obtener parámetros de la planta desde la BD
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

    // 2. Construir thresholds desde los datos del catálogo — backend siempre es la fuente de verdad
    const thresholds = {
      minTemperature:  plant.minTemperature,
      maxTemperature:  plant.maxTemperature,
      minHumidity:     plant.minHumidity,
      maxHumidity:     plant.maxHumidity,
      lightHours:      plant.lightHours,
      minWaterLevel:   plant.minWaterLevel,
      minSoilMoisture: plant.minSoilMoisture,
    };

    // 3. Delegar decisión al caso de uso de dominio
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
