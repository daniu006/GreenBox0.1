import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';

export interface PlantAiAnalysis {
  estado?: string;
  diagnostico?: string;
  recomendacion?: string;
  confianza?: string;
  healthScore: number;
  confidence: number;
  status: string;
  observations: string[];
  recommendations: string[];
  userNote?: string;
  analyzedAt: string;
}

export interface PlantPhoto {
  id: number;
  userPlantId: number;
  imageUrl: string;
  type: string;
  aiAnalysis: PlantAiAnalysis | null;
  takenAt: Date;
}

export interface CreatePhotoData {
  userPlantId: number;
  imageUrl: string;
  type: string;
  aiAnalysis?: Record<string, unknown> | null;
}

export const PHOTO_TYPES = ['initial', 'report'] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

@Injectable()
export class PhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePhotoData): Promise<PlantPhoto> {
    const photo = await this.prisma.plantPhoto.create({
      data: {
        userPlantId: data.userPlantId,
        imageUrl: data.imageUrl,
        type: data.type,
        aiAnalysis: data.aiAnalysis
          ? (data.aiAnalysis as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
    return photo as PlantPhoto;
  }

  async findByUserPlant(userPlantId: number): Promise<PlantPhoto[]> {
    const photos = await this.prisma.plantPhoto.findMany({
      where: { userPlantId },
      orderBy: { takenAt: 'desc' },
    });
    return photos as PlantPhoto[];
  }

  async findById(id: number): Promise<PlantPhoto | null> {
    const photo = await this.prisma.plantPhoto.findUnique({ where: { id } });
    return photo as PlantPhoto | null;
  }

  async updateAnalysis(
    id: number,
    analysis: Record<string, unknown>,
  ): Promise<PlantPhoto> {
    const photo = await this.prisma.plantPhoto.update({
      where: { id },
      data: { aiAnalysis: analysis as Prisma.InputJsonValue },
    });
    return photo as PlantPhoto;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.plantPhoto.delete({ where: { id } });
  }

  async countByUserPlant(userPlantId: number): Promise<number> {
    return this.prisma.plantPhoto.count({ where: { userPlantId } });
  }
}
