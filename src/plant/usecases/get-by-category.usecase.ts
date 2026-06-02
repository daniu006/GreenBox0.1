import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IPlantRepository, PLANT_REPOSITORY } from '../domain/plant.repository.interface';
import { Plant, PLANT_CATEGORIES } from '../domain/plant.entity';

@Injectable()
export class GetByCategoryUseCase {
  constructor(
    @Inject(PLANT_REPOSITORY)
    private readonly plantRepository: IPlantRepository,
  ) {}

  async execute(category: string): Promise<Plant[]> {
    // Validar categoría en backend — no se confía en lo que manda el frontend
    const validCategory = PLANT_CATEGORIES.find(c => c === category.toLowerCase());
    if (!validCategory) {
      throw new BadRequestException(
        `Categoría inválida. Las categorías válidas son: ${PLANT_CATEGORIES.join(', ')}`,
      );
    }

    return this.plantRepository.findByCategory(validCategory);
  }
}