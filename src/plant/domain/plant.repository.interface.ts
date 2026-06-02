import { Plant } from './plant.entity';

export interface IPlantRepository {
  findAll(): Promise<Plant[]>;
  findById(id: number): Promise<Plant | null>;
  findByCategory(category: string): Promise<Plant[]>;
  create(data: CreatePlantData): Promise<Plant>;
  update(id: number, data: Partial<CreatePlantData>): Promise<Plant>;
  delete(id: number): Promise<void>;
  exists(id: number): Promise<boolean>;
}

export interface CreatePlantData {
  name: string;
  category: string;
  imageUrl?: string;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  lightHours: number;
  minWaterLevel: number;
  minSoilMoisture?: number;
  wateringFrequency: number;
}

export const PLANT_REPOSITORY = 'PLANT_REPOSITORY';