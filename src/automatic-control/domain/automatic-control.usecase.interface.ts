import { ControlCommand, PlantThresholds, SensorReading } from './automatic-control.entity';

// Contrato del caso de uso de control automático
// El backend evalúa la lectura y retorna comandos para el ESP32
export interface IEvaluateReadingUseCase {
  execute(
    userPlantId: number,
    reading: SensorReading,
    thresholds: PlantThresholds,
  ): ControlCommand;
}

export const EVALUATE_READING_USE_CASE = 'EVALUATE_READING_USE_CASE';
