import {Inject,Injectable,NotFoundException,ForbiddenException,} from '@nestjs/common';
import { IUserPlantRepository, USER_PLANT_REPOSITORY } from '../domain/user-plant.repository.interface';
import { IPlantRepository, PLANT_REPOSITORY } from '../../plant/domain/plant.repository.interface';
import { IBoxRepository, BOX_REPOSITORY } from '../../box/domain/box.repository.interface';
import { CreateUserPlantDto } from '../user-plant.dto';
import { UserPlant } from '../domain/user-plant.entity';

@Injectable()
export class CreateUserPlantUseCase {
  constructor(
    @Inject(USER_PLANT_REPOSITORY)
    private readonly userPlantRepository: IUserPlantRepository,
    @Inject(PLANT_REPOSITORY)
    private readonly plantRepository: IPlantRepository,
    @Inject(BOX_REPOSITORY)
    private readonly boxRepository: IBoxRepository,
  ) {}

  async execute(dto: CreateUserPlantDto, userId: string): Promise<UserPlant> {
    // 1. Verificar que la planta existe en el catálogo — validación backend
    const plantExists = await this.plantRepository.exists(dto.plantId);
    if (!plantExists) {
      throw new NotFoundException('La planta seleccionada no existe en el catálogo');
    }

    // 2. Verificar que el box existe y pertenece al usuario
    const box = await this.boxRepository.findById(dto.boxId);
    if (!box) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    if (box.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para usar este dispositivo');
    }

    // 3. Crear la nueva instancia de planta
    // Si el usuario ya tenía una planta activa en este box,
    // la nueva empieza desde cero pero la anterior NO se borra
    // Solo se puede tener una planta activa por box a la vez
    const activePlant = await this.userPlantRepository.findActiveByBox(dto.boxId, userId);
    if (activePlant) {
      // Archivar la planta activa actual antes de crear la nueva
      await this.userPlantRepository.archive(activePlant.id);
    }

    // 4. Crear nueva instancia — empieza desde cero (startedAt = ahora)
    return this.userPlantRepository.create({
      userId,
      boxId: dto.boxId,
      plantId: dto.plantId,
      nickname: dto.nickname,
    });
  }
}