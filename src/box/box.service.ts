import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { BoxRepository, Box } from './box.repository';

export interface ValidateCodeResult {
  box: Box;
  plant: {
    id: number;
    name: string;
    category: string;
    minTemperature: number;
    maxTemperature: number;
    minHumidity: number;
    maxHumidity: number;
    lightHours: number;
    minWaterLevel: number;
    minSoilMoisture: number | null;
    wateringFrequency: number;
  } | null;
}

@Injectable()
export class BoxService {
  private readonly logger = new Logger(BoxService.name);

  constructor(
    private readonly boxRepository: BoxRepository,
    private readonly prisma: PrismaService,
  ) {}

  async validateCode(code: string, userId: string): Promise<ValidateCodeResult> {
    const box = await this.boxRepository.findByCode(code.toUpperCase());
    if (!box) {
      throw new NotFoundException('El código del dispositivo no existe');
    }

    if (box.userId && box.userId !== userId) {
      throw new ForbiddenException('Este dispositivo ya está asignado a otro usuario');
    }

    let assignedBox = box;
    if (!box.userId) {
      assignedBox = await this.boxRepository.assignToUser(box.id, userId);
      this.logger.log(`Box ${box.code} asignado al usuario ${userId}`);
    }

    const activeUserPlant = await this.prisma.userPlant.findFirst({
      where: { boxId: assignedBox.id, userId, archivedAt: null },
      include: { plant: true },
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

  async getByUser(userId: string): Promise<Box[]> {
    return this.boxRepository.findByUserId(userId);
  }

  async updateLocation(
    boxId: number,
    userId: string,
    latitude: number,
    longitude: number,
    locationName: string,
  ): Promise<Box> {
    const box = await this.boxRepository.findById(boxId);
    if (!box) {
      throw new NotFoundException('Dispositivo no encontrado');
    }
    if (box.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar este dispositivo');
    }
    return this.boxRepository.updateLocation(boxId, latitude, longitude, locationName);
  }

  async registerToken(boxId: number, token: string): Promise<void> {
    const box = await this.boxRepository.findById(boxId);
    if (!box) {
      throw new NotFoundException('Dispositivo no encontrado');
    }
    const tokens = await this.boxRepository.getFcmTokens(boxId);
    if (!tokens.includes(token)) {
      await this.boxRepository.addFcmToken(boxId, token);
    }
  }

  async removeToken(token: string): Promise<void> {
    await this.boxRepository.removeFcmToken(token);
  }

  hasLocation(box: Box): boolean {
    return box.latitude !== null && box.longitude !== null;
  }
}