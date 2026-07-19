import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

export interface Plant {
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
  createdAt: Date;
}

export interface CreatePlantData {
  name: string;
  category: string;
  imageUrl?: string;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  lightHours: number;
  minWaterLevel: number;
  minSoilMoisture?: number;
  wateringFrequency: number;
}

export const PLANT_CATEGORIES = [
  'medicinal',
  'frutal',
  'hortaliza',
  'vegetal',
] as const;

export type PlantCategory = typeof PLANT_CATEGORIES[number];

@Injectable()
export class PlantRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(): Promise<Plant[]> {
    return this.prisma.plant.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(id: number): Promise<Plant | null> {
    return this.prisma.plant.findUnique({ where: { id } });
  }

  async findByCategory(category: string): Promise<Plant[]> {
    return this.prisma.plant.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreatePlantData): Promise<Plant> {
    return this.prisma.plant.create({ data });
  }

  async update(id: number, data: Partial<CreatePlantData>): Promise<Plant> {
    return this.prisma.plant.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.plant.delete({ where: { id } });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.plant.count({ where: { id } });
    return count > 0;
  }
}