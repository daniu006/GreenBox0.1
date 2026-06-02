import { Statistic } from './statistic.entity';

export interface IStatisticUseCase {
  calculate(userPlantId: number): Promise<Statistic | null>;
  getLatest(userPlantId: number): Promise<Statistic | null>;
  getAll(userPlantId: number): Promise<Statistic[]>;
}

export const STATISTIC_USE_CASE = 'STATISTIC_USE_CASE';