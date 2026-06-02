import { Inject, Injectable, NotFoundException, ForbiddenException,} from '@nestjs/common';
import { IUserPlantRepository, USER_PLANT_REPOSITORY } from '../domain/user-plant.repository.interface';
import { UserPlant } from '../domain/user-plant.entity';

@Injectable()
export class ArchiveUserPlantUseCase {
  constructor(
    @Inject(USER_PLANT_REPOSITORY)
    private readonly userPlantRepository: IUserPlantRepository,
  ) {}

  async execute(id: number, userId: string): Promise<UserPlant> {
    // 1. Verificar que existe
    const userPlant = await this.userPlantRepository.findById(id);
    if (!userPlant) {
      throw new NotFoundException('Planta no encontrada');
    }

    // 2. Verificar que pertenece al usuario — seguridad backend
    if (userPlant.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para archivar esta planta');
    }

    // 3. Verificar que no está ya archivada
    if (!userPlant.isActive()) {
      throw new ForbiddenException('Esta planta ya está archivada');
    }

    // 4. Archivar — solo se llena archivedAt, NO se borran datos
    return this.userPlantRepository.archive(id);
  }
}