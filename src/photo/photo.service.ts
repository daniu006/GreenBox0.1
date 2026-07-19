import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PhotoRepository, PlantPhoto, PlantAiAnalysis } from './photo.repository';
import { CloudinaryService } from './cloudinary.service';

export interface PhotoFormatted {
  id:            number;
  userPlantId:   number;
  imageUrl:      string;
  type:          string;
  hasAnalysis:   boolean;
  aiAnalysis:    PlantAiAnalysis | null;
  healthSummary: string;
  takenAt:       Date;
}

@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);
  private static readonly MAX_PHOTOS_PER_PLANT = 50;

  constructor(
    private readonly photoRepository: PhotoRepository,
    private readonly cloudinaryService: CloudinaryService,
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

    const folder   = `greenbox/plants/${userPlantId}`;
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

    this.logger.log(`Foto ${type} subida para userPlant ${userPlantId} — ${imageUrl}`);
    return this.format(photo);
  }

  async analyze(photoId: number, userNote?: string, plantName?: string): Promise<PlantAiAnalysis> {
    const photo = await this.photoRepository.findById(photoId);
    if (!photo) throw new NotFoundException(`Foto ${photoId} no encontrada`);

    const analysis = await this.performAnalysis(photo.imageUrl, userNote, plantName);
    await this.photoRepository.updateAnalysis(
      photoId,
      analysis as unknown as Record<string, unknown>,
    );

    this.logger.log(`Análisis completado para foto ${photoId} — salud: ${analysis.healthScore}/100`);
    return analysis;
  }

  async getTimeline(userPlantId: number): Promise<PhotoFormatted[]> {
    const photos = await this.photoRepository.findByUserPlant(userPlantId);
    this.logger.debug(`Timeline para userPlant ${userPlantId}: ${photos.length} fotos`);
    return photos.map(p => this.format(p));
  }

  private format(photo: PlantPhoto): PhotoFormatted {
    return {
      id:            photo.id,
      userPlantId:   photo.userPlantId,
      imageUrl:      photo.imageUrl,
      type:          photo.type,
      hasAnalysis:   photo.aiAnalysis !== null,
      aiAnalysis:    photo.aiAnalysis,
      healthSummary: photo.aiAnalysis
        ? `${photo.aiAnalysis.healthScore}/100 — ${photo.aiAnalysis.status}`
        : 'Sin análisis',
      takenAt:       photo.takenAt,
    };
  }

  private async performAnalysis(imageUrl: string, userNote?: string, plantName?: string): Promise<PlantAiAnalysis> {
    const mockScores = [72, 85, 91, 68, 78, 94, 55, 80];
    const score = mockScores[Math.floor(Math.random() * mockScores.length)];
    const confidence = Math.floor(Math.random() * 15) + 82; // 82-96%
    const status =
      score >= 90 ? 'Excelente' :
      score >= 75 ? 'Saludable' :
      score >= 60 ? 'Atención recomendada' :
                   'Requiere cuidado urgente';

    const observations:    string[] = [];
    const recommendations: string[] = [];

    // Base analysis from image
    if (score < 75) {
      observations.push('Se detectan posibles signos de estrés hídrico');
      recommendations.push('Revisa la frecuencia de riego');
    }
    if (score < 60) {
      observations.push('Las hojas muestran decoloración leve');
      recommendations.push('Verifica el nivel de nutrientes del suelo');
      recommendations.push('Asegúrate de que reciba luz suficiente');
    }
    if (score >= 75) {
      observations.push('Follaje verde y uniforme');
      observations.push('Sin signos visibles de plagas o enfermedades');
      recommendations.push('Mantén el cuidado actual');
      recommendations.push('Continúa con el mismo riego');
    }

    // Personalize based on user notes
    if (userNote) {
      const note = userNote.toLowerCase();
      if (note.includes('hoja') && (note.includes('amarilla') || note.includes('amarillo'))) {
        observations.push('El usuario reporta hojas amarillas — posible deficiencia de nitrógeno');
        recommendations.push('Considera agregar fertilizante rico en nitrógeno');
      }
      if (note.includes('plaga') || note.includes('insecto') || note.includes('bicho')) {
        observations.push('El usuario reporta presencia de plagas o insectos');
        recommendations.push('Aplica neem u otro insecticida orgánico');
        recommendations.push('Aísla la planta para evitar contagio');
      }
      if (note.includes('seca') || note.includes('marchit') || note.includes('seco')) {
        observations.push('El usuario indica síntomas de deshidratación');
        recommendations.push('Aumenta la frecuencia de riego');
        recommendations.push('Revisa que el sustrato retenga humedad correctamente');
      }
      if (note.includes('creci') || note.includes('nueva hoja') || note.includes('brote')) {
        observations.push('El usuario reporta nuevo crecimiento activo');
        recommendations.push('La planta está en una etapa saludable de crecimiento');
        recommendations.push('Mantén las condiciones actuales de luz y humedad');
      }
    }

    // Add plant-specific recommendations
    if (plantName) {
      const plant = plantName.toLowerCase();
      if (plant.includes('poto') || plant.includes('pothos')) {
        recommendations.push('El Poto prefiere luz indirecta brillante');
        recommendations.push('No se observan signos de plagas en el follaje');
      } else if (plant.includes('alb') || plant.includes('basil')) {
        recommendations.push('La albahaca necesita al menos 6 horas de luz directa');
      } else if (plant.includes('ment') || plant.includes('mint')) {
        recommendations.push('La menta puede regarse cuando el sustrato esté a medio secar');
      }
    }

    return {
      healthScore:     score,
      confidence,
      status,
      observations:    [...new Set(observations)],
      recommendations: [...new Set(recommendations)],
      userNote,
      analyzedAt:      new Date().toISOString(),
    };
  }
}