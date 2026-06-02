import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { IBoxRepository, BOX_REPOSITORY } from '../domain/box.repository.interface';
import { ValidateCodeResult } from '../domain/box.usecase.interface';

@Injectable()
export class ValidateCodeUseCase {
  private readonly logger = new Logger(ValidateCodeUseCase.name);

  constructor(
    @Inject(BOX_REPOSITORY)
    private readonly boxRepository: IBoxRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(code: string, userId: string): Promise<ValidateCodeResult> {
    // 1. Buscar el box por código — validado en backend
    const box = await this.boxRepository.findByCode(code.toUpperCase());

    if (!box) {
      throw new NotFoundException('El código del dispositivo no existe');
    }

    // 2. Verificar que el box no está asignado a otro usuario
    if (box.userId && box.userId !== userId) {
      throw new ForbiddenException('Este dispositivo ya está asignado a otro usuario');
    }

    // 3. Asignar el box al usuario si aún no lo está
    let assignedBox = box;
    if (!box.userId) {
      assignedBox = await this.boxRepository.assignToUser(box.id, userId);
      this.logger.log(`Box ${box.code} asignado al usuario ${userId}`);
    }

    // 4. Obtener la planta activa del box si tiene una
    // Se busca el userPlant activo más reciente
    const activeUserPlant = await this.prisma.userPlant.findFirst({
      where: {
        boxId: assignedBox.id,
        userId,
        archivedAt: null,
      },
      include: {
        plant: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      box: assignedBox,
      plant: activeUserPlant?.plant
        ? {
            id: activeUserPlant.plant.id,
            name: activeUserPlant.plant.name,
            category: activeUserPlant.plant.category,
            minTemperature: activeUserPlant.plant.minTemperature,
            maxTemperature: activeUserPlant.plant.maxTemperature,
            minHumidity: activeUserPlant.plant.minHumidity,
            maxHumidity: activeUserPlant.plant.maxHumidity,
            lightHours: activeUserPlant.plant.lightHours,
            minWaterLevel: activeUserPlant.plant.minWaterLevel,
            minSoilMoisture: activeUserPlant.plant.minSoilMoisture,
            wateringFrequency: activeUserPlant.plant.wateringFrequency,
          }
        : null,
    };
  }
}