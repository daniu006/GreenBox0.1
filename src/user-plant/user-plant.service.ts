import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  UserPlantRepository,
  UserPlant,
  CreateUserPlantData,
} from './user-plant.repository';
import { PlantRepository } from 'src/plant/plant.repository';
import { BoxRepository } from 'src/box/box.repository';
import { CreateUserPlantDto } from './user-plant.dto';

export interface UserPlantFormatted {
  id: number;
  boxId: number;
  nickname: string | null;
  displayName: string;
  status: string;
  isActive: boolean;
  startedAt: Date;
  archivedAt: Date | null;
  plant: {
    id: number;
    name: string;
    category: string;
    imageUrl: string | null;
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
export class UserPlantService {
  constructor(
    private readonly userPlantRepository: UserPlantRepository,
    private readonly plantRepository: PlantRepository,
    private readonly boxRepository: BoxRepository,
  ) {}

  async create(
    dto: CreateUserPlantDto,
    userId: string,
  ): Promise<UserPlantFormatted> {
    const plantExists = await this.plantRepository.exists(dto.plantId);
    if (!plantExists) {
      throw new NotFoundException(
        'La planta seleccionada no existe en el catálogo',
      );
    }

    const box = await this.boxRepository.findById(dto.boxId);
    if (!box) {
      throw new NotFoundException('Dispositivo no encontrado');
    }
    if (box.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para usar este dispositivo',
      );
    }

    const activePlant = await this.userPlantRepository.findActiveByBox(
      dto.boxId,
      userId,
    );
    if (activePlant) {
      await this.userPlantRepository.archive(activePlant.id);
    }

    const userPlant = await this.userPlantRepository.create({
      userId,
      boxId: dto.boxId,
      plantId: dto.plantId,
      nickname: dto.nickname,
    });

    return this.format(userPlant);
  }

  async getActive(userId: string): Promise<UserPlantFormatted[]> {
    const userPlants = await this.userPlantRepository.findActiveByUser(userId);
    return userPlants.map((up) => this.format(up));
  }

  async getAll(userId: string): Promise<UserPlantFormatted[]> {
    const userPlants = await this.userPlantRepository.findAllByUser(userId);
    return userPlants.map((up) => this.format(up));
  }

  async archive(id: number, userId: string): Promise<UserPlantFormatted> {
    const userPlant = await this.userPlantRepository.findById(id);
    if (!userPlant) throw new NotFoundException('Planta no encontrada');
    if (userPlant.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para archivar esta planta',
      );
    }
    if (userPlant.archivedAt !== null) {
      throw new ForbiddenException('Esta planta ya está archivada');
    }

    const archived = await this.userPlantRepository.archive(id);
    return this.format(archived);
  }

  async delete(id: number, userId: string): Promise<void> {
    const userPlant = await this.userPlantRepository.findById(id);
    if (!userPlant) throw new NotFoundException('Planta no encontrada');
    if (userPlant.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta planta',
      );
    }
    await this.userPlantRepository.delete(id);
  }

  private format(up: UserPlant): UserPlantFormatted {
    return {
      id: up.id,
      boxId: up.boxId,
      nickname: up.nickname,
      displayName: up.nickname ?? up.plant?.name ?? 'Mi planta',
      status: up.status,
      isActive: up.archivedAt === null,
      startedAt: up.startedAt,
      archivedAt: up.archivedAt,
      plant: up.plant ?? null,
    };
  }
}
