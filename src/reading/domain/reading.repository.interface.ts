import { Reading } from './reading.entity';

export interface CreateReadingData {
  userPlantId: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightHours: number;
  waterLevel: number;
}

export interface IReadingRepository {
  create(data: CreateReadingData): Promise<Reading>;
  findLatest(userPlantId: number): Promise<Reading | null>;
  findByDay(userPlantId: number, date: Date): Promise<Reading[]>;
  findByWeek(userPlantId: number, startDate: Date, endDate: Date): Promise<Reading[]>;
  findByMonth(userPlantId: number, year: number, month: number): Promise<Reading[]>;
  findByPeriod(userPlantId: number, startDate: Date, endDate: Date): Promise<Reading[]>;
}

export const READING_REPOSITORY = 'READING_REPOSITORY';