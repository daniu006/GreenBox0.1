import { Inject, Injectable } from '@nestjs/common';
import { IPlantRepository, PLANT_REPOSITORY } from '../domain/plant.repository.interface';
import { Plant } from '../domain/plant.entity';
import { NotFoundException } from '@nestjs/common';

export interface PlantsByCategory {
  category: string;
  plants: Plant[];
}

@Injectable()
export class GetPlantsUseCase {
  constructor(
    @Inject(PLANT_REPOSITORY)
    private readonly plantRepository: IPlantRepository,
  ) {}

  // Devuelve todas las plantas agrupadas por categoría
  async execute(id: number): Promise<Plant> {
    const plant = await this.plantRepository.findById(id);
    if (!plant) {
      throw new NotFoundException(`Planta con ID ${id} no encontrada`);
    }
    return plant;
  }
}