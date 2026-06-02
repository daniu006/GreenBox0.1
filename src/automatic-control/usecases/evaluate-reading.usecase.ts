import { Injectable, Logger } from '@nestjs/common';
import {
  ControlCommand,
  PlantThresholds,
  SensorReading,
} from '../domain/automatic-control.entity';
import { IEvaluateReadingUseCase } from '../domain/automatic-control.usecase.interface';

/**
 * EvaluateReadingUseCase
 *
 * Toda la lógica de decisión de actuadores vive aquí — nunca en el ESP32 ni en el frontend.
 * Recibe la lectura validada y los umbrales de la planta (obtenidos de la BD),
 * retorna comandos que el ESP32 debe ejecutar.
 *
 * Reglas de negocio:
 *   - Bomba ON  → suelo seco (< minSoilMoisture) Y hay agua disponible (> minWaterLevel)
 *   - Luz ON    → horas de luz del día aún no cubiertas (lightHours < lightHours requeridas)
 *   - Si el depósito está vacío, la bomba no se activa aunque el suelo esté seco
 *     (evitar quemar la bomba)
 */
@Injectable()
export class EvaluateReadingUseCase implements IEvaluateReadingUseCase {
  private readonly logger = new Logger(EvaluateReadingUseCase.name);

  execute(
    userPlantId: number,
    reading: SensorReading,
    thresholds: PlantThresholds,
  ): ControlCommand {
    const reasons: string[] = [];

    // ── Bomba de agua ──────────────────────────────────────────────────────
    const minSoil   = thresholds.minSoilMoisture ?? 30; // valor default si la planta no especifica
    const soilDry   = reading.soilMoisture < minSoil;
    const hasWater  = reading.waterLevel   > thresholds.minWaterLevel;

    const pump = soilDry && hasWater;

    if (soilDry && !hasWater) {
      reasons.push(`Suelo seco (${reading.soilMoisture}%) pero sin agua (${reading.waterLevel}%)`);
    } else if (pump) {
      reasons.push(`Suelo seco (${reading.soilMoisture}% < ${minSoil}%) — activando bomba`);
    }

    // ── Luz artificial ─────────────────────────────────────────────────────
    const light = reading.lightHours < thresholds.lightHours;

    if (light) {
      reasons.push(
        `Luz insuficiente (${reading.lightHours}h de ${thresholds.lightHours}h requeridas)`,
      );
    }

    // ── Logging de la decisión ─────────────────────────────────────────────
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
