import { Box } from './box.entity';

export interface IBoxRepository {
  findByCode(code: string): Promise<Box | null>;
  findById(id: number): Promise<Box | null>;
  findByUserId(userId: string): Promise<Box[]>;
  assignToUser(boxId: number, userId: string): Promise<Box>;
  updateLocation(boxId: number, latitude: number, longitude: number, locationName: string): Promise<Box>;
  addFcmToken(boxId: number, token: string): Promise<void>;
  removeFcmToken(token: string): Promise<void>;
  getFcmTokens(boxId: number): Promise<string[]>;
}

export const BOX_REPOSITORY = 'BOX_REPOSITORY';