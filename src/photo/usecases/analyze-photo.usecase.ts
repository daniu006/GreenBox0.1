import {
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PHOTO_REPOSITORY, IPhotoRepository } from '../domain/photo.repository.interface';
import { PlantAiAnalysis } from '../domain/photo.entity';

/**
 * AnalyzePhotoUseCase
 *
 * Análisis de salud de la planta mediante IA a partir de una foto.
 *
 * IMPORTANTE — Toda la evaluación de salud vive en el backend:
 *   ✅ El backend recibe la foto, la analiza y guarda el resultado en la BD
 *   ❌ El frontend nunca calcula salud ni interpreta imágenes
 *
 * En esta versión se usa un análisis simulado (mock).
 * Para producción, integrar con Google Cloud Vision o Gemini Pro Vision.
 *
 * El análisis se guarda en el campo `aiAnalysis` (JSON) de `plant_photos`.
 */
@Injectable()
export class AnalyzePhotoUseCase {
  private readonly logger = new Logger(AnalyzePhotoUseCase.name);

  constructor(
    @Inject(PHOTO_REPOSITORY)
    private readonly photoRepository: IPhotoRepository,
  ) {}

  async execute(photoId: number): Promise<PlantAiAnalysis> {
    // 1. Verificar que la foto existe
    const photo = await this.photoRepository.findById(photoId);
    if (!photo) {
      throw new NotFoundException(`Foto ${photoId} no encontrada`);
    }

    // 2. Realizar análisis — aquí iría la llamada a la API de IA
    // Por ahora: análisis determinista basado en la URL (mock realista)
    const analysis = await this.performAnalysis(photo.imageUrl);

    // 3. Guardar el análisis en la BD
    await this.photoRepository.updateAnalysis(photoId, analysis as unknown as Record<string, unknown>);

    this.logger.log(
      `Análisis completado para foto ${photoId} — salud: ${analysis.healthScore}/100`,
    );

    return analysis;
  }

  /**
   * Análisis de IA.
   * Reemplazar con llamada real a Gemini Vision / Google Vision API en producción.
   */
  private async performAnalysis(imageUrl: string): Promise<PlantAiAnalysis> {
    // TODO: Integrar con Google Gemini Pro Vision o Cloud Vision API
    // Ejemplo de llamada real:
    //   const response = await geminiClient.analyze(imageUrl);
    //   return this.mapGeminiResponse(response);

    // Mock de análisis — simula respuesta de IA
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
