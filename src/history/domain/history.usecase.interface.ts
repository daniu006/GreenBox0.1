import { History, HistoryType } from './history.entity';

export interface HistoryWithPeaks {
  records: History[];
  peaks: {
    temperature: { max: number; maxAt: Date; min: number; minAt: Date };
    humidity:    { max: number; maxAt: Date; min: number; minAt: Date };
    health:      { max: number; maxAt: Date; min: number; minAt: Date };
  };
}

export interface IHistoryUseCase {
  save(userPlantId: number, type: HistoryType): Promise<History>;
  getByPeriod(userPlantId: number, period: HistoryType, dateStr?: string): Promise<HistoryWithPeaks>;
}

export const HISTORY_USE_CASE = 'HISTORY_USE_CASE';