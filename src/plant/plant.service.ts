import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  PlantRepository,
  Plant,
  CreatePlantData,
  PLANT_CATEGORIES,
} from './plant.repository';

export interface PlantsByCategory {
  category: string;
  plants: Plant[];
}

@Injectable()
export class PlantService {
  constructor(private readonly plantRepository: PlantRepository) {}

  // MODIFICADO: userId opcional
  async getAll(userId?: string): Promise<PlantsByCategory[]> {
    const plants = userId
      ? await this.plantRepository.findAllForUser(userId)
      : await this.plantRepository.findGlobalCatalog();

    const grouped = plants.reduce(
      (acc, plant) => {
        if (!acc[plant.category]) acc[plant.category] = [];
        acc[plant.category].push(plant);
        return acc;
      },
      {} as Record<string, Plant[]>,
    );

    return Object.entries(grouped).map(([category, plants]) => ({
      category,
      plants,
    }));
  }

  async getById(id: number): Promise<Plant> {
    const plant = await this.plantRepository.findById(id);
    if (!plant)
      throw new NotFoundException(`Planta con ID ${id} no encontrada`);
    return plant;
  }

  async getByCategory(category: string, userId?: string): Promise<Plant[]> {
    const validCategory = PLANT_CATEGORIES.find(
      (c) => c === category.toLowerCase(),
    );
    if (!validCategory) {
      throw new BadRequestException(
        `Categoría inválida. Las categorías válidas son: ${PLANT_CATEGORIES.join(', ')}`,
      );
    }

    if (userId) {
      const all = await this.plantRepository.findAllForUser(userId);
      return all.filter((p) => p.category === validCategory);
    }

    return this.plantRepository.findByCategory(validCategory);
  }

  // MODIFICADO: requiere userId y lo asigna automáticamente
  async create(data: CreatePlantData, userId: string): Promise<Plant> {
    const dataWithUser: CreatePlantData = {
      ...data,
      createdByUserId: userId,
    };
    return this.plantRepository.create(dataWithUser);
  }

  async update(id: number, data: Partial<CreatePlantData>): Promise<Plant> {
    const exists = await this.plantRepository.exists(id);
    if (!exists)
      throw new NotFoundException(`Planta con id ${id} no encontrada`);
    return this.plantRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.plantRepository.delete(id);
  }
}
