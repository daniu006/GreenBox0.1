import {
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PHOTO_REPOSITORY, IPhotoRepository } from '../domain/photo.repository.interface';
import { PlantAiAnalysis } from '../domain/photo.entity';
@Injectable()
export class AnalyzePhotoUseCase {
  private readonly logger = new Logger(AnalyzePhotoUseCase.name);
  constructor(
    @Inject(PHOTO_REPOSITORY)
    private readonly photoRepository: IPhotoRepository,
  ) {}
  async execute(photoId: number): Promise<PlantAiAnalysis> {
    const photo = await this.photoRepository.findById(photoId);
    if (!photo) {
      throw new NotFoundException(`Foto ${photoId} no encontrada`);
    }
    const analysis = await this.performAnalysis(photo.imageUrl);
    await this.photoRepository.updateAnalysis(photoId, analysis as unknown as Record<string, unknown>);
    this.logger.log(
      `Análisis completado para foto ${photoId} — salud: ${analysis.healthScore}/100`,
    );
    return analysis;
  }
  private async performAnalysis(imageUrl: string): Promise<PlantAiAnalysis> {
    const mockScores = [72, 85, 91, 68, 78, 94, 55, 80];
    const score = mockScores[Math.floor(Math.random() * mockScores.length)];
    const status =
      score >= 90 ? 'Excelente' :
      score >= 75 ? 'Saludable' :
      score >= 60 ? 'Atención recomendada' :
                   'Requiere cuidado urgente';
    const observations: string[] = [];
    const recommendations: string[] = [];
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
    }
    return {
      healthScore:     score,
      status,
      observations,
      recommendations,
      analyzedAt:      new Date().toISOString(),
    };
  }
}
