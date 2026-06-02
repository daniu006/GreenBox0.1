import { Inject, Injectable } from '@nestjs/common';
import { IUserPlantRepository, USER_PLANT_REPOSITORY } from '../domain/user-plant.repository.interface';
import { UserPlant } from '../domain/user-plant.entity';

@Injectable()
export class GetUserPlantsUseCase {
  constructor(
    @Inject(USER_PLANT_REPOSITORY)
    private readonly userPlantRepository: IUserPlantRepository,
  ) {}

  // Todas las plantas (activas + archivadas) — para el historial completo
  async getAll(userId: string): Promise<UserPlant[]> {
    return this.userPlantRepository.findAllByUser(userId);
  }

  // Solo las activas — para el home y selección de planta actual
  async getActive(userId: string): Promise<UserPlant[]> {
    return this.userPlantRepository.findActiveByUser(userId);
  }
}