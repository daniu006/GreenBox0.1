import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IBoxRepository, BOX_REPOSITORY } from '../domain/box.repository.interface';
import { Box } from '../domain/box.entity';

@Injectable()
export class UpdateLocationUseCase {
  constructor(
    @Inject(BOX_REPOSITORY)
    private readonly boxRepository: IBoxRepository,
  ) {}

  async execute(
    boxId: number,
    userId: string,
    latitude: number,
    longitude: number,
    locationName: string,
  ): Promise<Box> {
    // 1. Verificar que el box existe
    const box = await this.boxRepository.findById(boxId);
    if (!box) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    // 2. Verificar que el box pertenece al usuario — seguridad backend
    if (box.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar este dispositivo');
    }

    // 3. Actualizar ubicación
    return this.boxRepository.updateLocation(boxId, latitude, longitude, locationName);
  }
}