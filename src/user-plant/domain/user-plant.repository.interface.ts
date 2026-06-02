import { UserPlant } from './user-plant.entity';

export interface CreateUserPlantData {
  userId: string;
  boxId: number;
  plantId: number;
  nickname?: string;
}

export interface IUserPlantRepository {
  create(data: CreateUserPlantData): Promise<UserPlant>;
  findById(id: number): Promise<UserPlant | null>;
  findAllByUser(userId: string): Promise<UserPlant[]>;
  findActiveByUser(userId: string): Promise<UserPlant[]>;
  findActiveByBox(boxId: number, userId: string): Promise<UserPlant | null>;
  archive(id: number): Promise<UserPlant>;
  delete(id: number): Promise<void>;
  belongsToUser(id: number, userId: string): Promise<boolean>;
}

export const USER_PLANT_REPOSITORY = 'USER_PLANT_REPOSITORY';