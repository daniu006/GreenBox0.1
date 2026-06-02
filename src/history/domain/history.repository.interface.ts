import { History, HistoryType } from './history.entity';

export interface SaveHistoryData {
  userPlantId: number;
  type: HistoryType;
  week: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightHours: number;
  waterLevel: number;
  estimatedHealth: number;
}

export interface IHistoryRepository {
  save(data: SaveHistoryData): Promise<History>;
  findByType(userPlantId: number, type: HistoryType): Promise<History[]>;
  findByDay(userPlantId: number, date: Date): Promise<History[]>;
  findByWeek(userPlantId: number, week: number): Promise<History[]>;
  findByMonth(userPlantId: number, year: number, month: number): Promise<History[]>;
  findLatest(userPlantId: number): Promise<History | null>;
}

export const HISTORY_REPOSITORY = 'HISTORY_REPOSITORY';