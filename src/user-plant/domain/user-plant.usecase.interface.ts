import { UserPlant } from './user-plant.entity';
import { CreateUserPlantDto } from '../user-plant.dto';

export interface IUserPlantUseCase {
  create(dto: CreateUserPlantDto, userId: string): Promise<UserPlant>;
  getAllByUser(userId: string): Promise<UserPlant[]>;
  getActiveByUser(userId: string): Promise<UserPlant[]>;
  archive(id: number, userId: string): Promise<UserPlant>;
  delete(id: number, userId: string): Promise<void>;
}

export const USER_PLANT_USE_CASE = 'USER_PLANT_USE_CASE';