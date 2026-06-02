import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IUserPlantRepository, USER_PLANT_REPOSITORY } from '../domain/user-plant.repository.interface';

@Injectable()
export class DeleteUserPlantUseCase {
  constructor(
    @Inject(USER_PLANT_REPOSITORY)
    private readonly userPlantRepository: IUserPlantRepository,
  ) {}

  async execute(id: number, userId: string): Promise<void> {
    // 1. Verificar que existe
    const userPlant = await this.userPlantRepository.findById(id);
    if (!userPlant) {
      throw new NotFoundException('Planta no encontrada');
    }

    // 2. Verificar que pertenece al usuario — nadie borra datos ajenos
    if (userPlant.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta planta');
    }

    // 3. Eliminar — borra lecturas, historial, fotos, alertas (CASCADE en BD)
    // Solo llega aquí si el usuario lo decidió explícitamente
    await this.userPlantRepository.delete(id);
  }
}