import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  PhotoRepository,
  PlantPhoto,
  PlantAiAnalysis,
} from './photo.repository';
import { CloudinaryService } from './cloudinary.service';
import { GeminiPlantAnalyzer } from './gemini-plant-analyzer';

export interface PhotoFormatted {
  id: number;
  userPlantId: number;
  imageUrl: string;
  type: string;
  hasAnalysis: boolean;
  aiAnalysis: PlantAiAnalysis | null;
  healthSummary: string;
  takenAt: Date;
}

@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);
  private static readonly MAX_PHOTOS_PER_PLANT = 50;

  constructor(
    private readonly photoRepository: PhotoRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly geminiPlantAnalyzer: GeminiPlantAnalyzer,
  ) {}

  async upload(
    userPlantId: number,
    file: Express.Multer.File,
    type: 'initial' | 'report',
  ): Promise<PhotoFormatted> {
    const count = await this.photoRepository.countByUserPlant(userPlantId);
    if (count >= PhotoService.MAX_PHOTOS_PER_PLANT) {
      throw new BadRequestException(
        `Límite de ${PhotoService.MAX_PHOTOS_PER_PLANT} fotos por planta alcanzado`,
      );
    }

    const folder = `greenbox/plants/${userPlantId}`;
    const publicId = `${type}-${Date.now()}`;
    const imageUrl = await this.cloudinaryService.uploadBuffer(
      file.buffer,
      folder,
      publicId,
    );

    const photo = await this.photoRepository.create({
      userPlantId,
      imageUrl,
      type,
      aiAnalysis: null,
    });

    this.logger.log(
      `Foto ${type} subida para userPlant ${userPlantId} — ${imageUrl}`,
    );
    return this.format(photo);
  }

  async analyze(
    photoId: number,
    userNote?: string,
    plantName?: string,
  ): Promise<PlantAiAnalysis> {
    const photo = await this.photoRepository.findById(photoId);
    if (!photo) throw new NotFoundException(`Foto ${photoId} no encontrada`);

    const analysis = await this.geminiPlantAnalyzer.analyze(
      photo.imageUrl,
      userNote,
      plantName,
    );
    await this.photoRepository.updateAnalysis(
      photoId,
      analysis as unknown as Record<string, unknown>,
    );

    this.logger.log(
      `Análisis completado para foto ${photoId} — salud: ${analysis.healthScore}/100`,
    );
    return analysis;
  }

  async getTimeline(userPlantId: number): Promise<PhotoFormatted[]> {
    const photos = await this.photoRepository.findByUserPlant(userPlantId);
    this.logger.debug(
      `Timeline para userPlant ${userPlantId}: ${photos.length} fotos`,
    );
    return photos.map((p) => this.format(p));
  }

  private format(photo: PlantPhoto): PhotoFormatted {
    return {
      id: photo.id,
      userPlantId: photo.userPlantId,
      imageUrl: photo.imageUrl,
      type: photo.type,
      hasAnalysis: photo.aiAnalysis !== null,
      aiAnalysis: photo.aiAnalysis,
      healthSummary: photo.aiAnalysis
        ? `${photo.aiAnalysis.healthScore}/100 — ${photo.aiAnalysis.status}`
        : 'Sin análisis',
      takenAt: photo.takenAt,
    };
  }
}
