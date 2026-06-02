import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../shared/prisma/prisma.service';
import {
  IPhotoRepository,
  CreatePhotoData,
  PHOTO_REPOSITORY,
} from './domain/photo.repository.interface';
import { PlantPhoto, PlantAiAnalysis } from './domain/photo.entity';

@Injectable()
export class PhotoPrismaRepository implements IPhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(raw: any): PlantPhoto {
    return new PlantPhoto(
      raw.id,
      raw.userPlantId,
      raw.imageUrl,
      raw.type,
      raw.aiAnalysis as PlantAiAnalysis | null,
      raw.takenAt,
    );
  }

  async create(data: CreatePhotoData): Promise<PlantPhoto> {
    const photo = await this.prisma.plantPhoto.create({
      data: {
        userPlantId: data.userPlantId,
        imageUrl:    data.imageUrl,
        type:        data.type,
        aiAnalysis:  data.aiAnalysis
          ? (data.aiAnalysis as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
    return this.toEntity(photo);
  }

  async findByUserPlant(userPlantId: number): Promise<PlantPhoto[]> {
    const photos = await this.prisma.plantPhoto.findMany({
      where: { userPlantId },
      orderBy: { takenAt: 'desc' },
    });
    return photos.map(p => this.toEntity(p));
  }

  async findById(id: number): Promise<PlantPhoto | null> {
    const photo = await this.prisma.plantPhoto.findUnique({ where: { id } });
    return photo ? this.toEntity(photo) : null;
  }

  async updateAnalysis(
    id: number,
    analysis: Record<string, unknown>,
  ): Promise<PlantPhoto> {
    const photo = await this.prisma.plantPhoto.update({
      where: { id },
      data: { aiAnalysis: analysis as Prisma.InputJsonValue },
    });
    return this.toEntity(photo);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.plantPhoto.delete({ where: { id } });
  }

  async countByUserPlant(userPlantId: number): Promise<number> {
    return this.prisma.plantPhoto.count({ where: { userPlantId } });
  }
}
