import { Inject, Injectable } from '@nestjs/common';
import { IPlantRepository, PLANT_REPOSITORY } from '../domain/plant.repository.interface';
import { Plant } from '../domain/plant.entity';

export interface PlantsByCategory {
  category: string;
  plants: Plant[];
}

@Injectable()
export class GetAllPlantsUseCase {
  constructor(
    @Inject(PLANT_REPOSITORY)
    private readonly plantRepository: IPlantRepository,
  ) {}

  // Devuelve todas las plantas agrupadas por categoría
  // para la pantalla de selección con taxonomía híbrida
  async execute(): Promise<PlantsByCategory[]> {
    const plants = await this.plantRepository.findAll();

    // Agrupar por categoría en el backend — nunca en el frontend
    const grouped = plants.reduce((acc, plant) => {
      if (!acc[plant.category]) {
        acc[plant.category] = [];
      }
      acc[plant.category].push(plant);
      return acc;
    }, {} as Record<string, Plant[]>);

    return Object.entries(grouped).map(([category, plants]) => ({
      category,
      plants,
    }));
  }
}