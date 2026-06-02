import { Injectable, Logger } from '@nestjs/common';
import {
  ControlCommand,
  PlantThresholds,
  SensorReading,
} from '../domain/automatic-control.entity';
import { IEvaluateReadingUseCase } from '../domain/automatic-control.usecase.interface';
@Injectable()
export class EvaluateReadingUseCase implements IEvaluateReadingUseCase {
  private readonly logger = new Logger(EvaluateReadingUseCase.name);
  execute(
    userPlantId: number,
    reading: SensorReading,
    thresholds: PlantThresholds,
  ): ControlCommand {
    const reasons: string[] = [];
    const minSoil   = thresholds.minSoilMoisture ?? 30; 
    const soilDry   = reading.soilMoisture < minSoil;
    const hasWater  = reading.waterLevel   > thresholds.minWaterLevel;
    const pump = soilDry && hasWater;
    if (soilDry && !hasWater) {
      reasons.push(`Suelo seco (${reading.soilMoisture}%) pero sin agua (${reading.waterLevel}%)`);
    } else if (pump) {
      reasons.push(`Suelo seco (${reading.soilMoisture}% < ${minSoil}%) — activando bomba`);
    }
    const light = reading.lightHours < thresholds.lightHours;
    if (light) {
      reasons.push(
        `Luz insuficiente (${reading.lightHours}h de ${thresholds.lightHours}h requeridas)`,
      );
    }
    const reason = reasons.length > 0 ? reasons.join(' | ') : 'Todos los parámetros OK';
    const command = new ControlCommand(
      userPlantId,
      pump,
      light,
      reason,
      new Date(),
    );
    this.logger.log(command.summary());
    return command;
  }
}
