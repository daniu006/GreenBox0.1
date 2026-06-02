import { Box } from './box.entity';

export interface ValidateCodeResult {
  box: Box;
  plant: {
    id: number;
    name: string;
    category: string;
    minTemperature: number;
    maxTemperature: number;
    minHumidity: number;
    maxHumidity: number;
    lightHours: number;
    minWaterLevel: number;
    minSoilMoisture: number | null;
    wateringFrequency: number;
  } | null;
}

export interface IBoxUseCase {
  validateCode(code: string, userId: string): Promise<ValidateCodeResult>;
  updateLocation(boxId: number, userId: string, latitude: number, longitude: number, locationName: string): Promise<Box>;
  registerFcmToken(boxId: number, token: string): Promise<void>;
  removeFcmToken(token: string): Promise<void>;
  getBoxesByUser(userId: string): Promise<Box[]>;
}

export const BOX_USE_CASE = 'BOX_USE_CASE';