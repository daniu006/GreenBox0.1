import { ControlCommand, PlantThresholds, SensorReading } from './automatic-control.entity';
export interface IEvaluateReadingUseCase {
  execute(
    userPlantId: number,
    reading: SensorReading,
    thresholds: PlantThresholds,
  ): ControlCommand;
}
export const EVALUATE_READING_USE_CASE = 'EVALUATE_READING_USE_CASE';
