import { PlantPhoto, PhotoType } from './photo.entity';

export interface CreatePhotoData {
  userPlantId: number;
  imageUrl:    string;
  type:        PhotoType;
  aiAnalysis?: Record<string, unknown> | null;
}

export interface IPhotoRepository {
  create(data: CreatePhotoData): Promise<PlantPhoto>;
  findByUserPlant(userPlantId: number): Promise<PlantPhoto[]>;
  findById(id: number): Promise<PlantPhoto | null>;
  updateAnalysis(id: number, analysis: Record<string, unknown>): Promise<PlantPhoto>;
  delete(id: number): Promise<void>;
  countByUserPlant(userPlantId: number): Promise<number>;
}

export const PHOTO_REPOSITORY = 'PHOTO_REPOSITORY';
