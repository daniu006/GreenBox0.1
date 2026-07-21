import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PlantAiAnalysis } from './photo.repository';

interface GeminiPlantAnalysisResponse {
  estado: 'sana' | 'atencion' | 'critica';
  diagnostico: string;
  recomendacion: string;
  confianza: 'alta' | 'media' | 'baja';
}

@Injectable()
export class GeminiPlantAnalyzer {
  private readonly logger = new Logger(GeminiPlantAnalyzer.name);
  private genAI: GoogleGenerativeAI | null = null;

  async analyze(
    imageUrl: string,
    userObservation?: string,
    plantName?: string,
  ): Promise<PlantAiAnalysis> {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new ServiceUnavailableException(
        `No se pudo descargar la imagen para análisis (${imageResponse.status})`,
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const base64Image = imageBuffer.toString('base64');
    const mimeType = this.getImageMimeType(imageResponse);

    const model = this.getGenAI().getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `Sos un experto en botánica analizando una planta a través de una imagen y la observación de un usuario.

Planta: "${plantName || 'sin especificar'}"
Observación del usuario: "${userObservation || 'sin observación'}"

Analizá la imagen y devolvé SOLO este JSON, sin texto extra:
{
  "estado": "sana | atencion | critica",
  "diagnostico": "string breve, 1-2 oraciones",
  "recomendacion": "string breve, acciones concretas",
  "confianza": "alta | media | baja"
}`;

    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64Image } },
      { text: prompt },
    ]);

    const analyzedAt = new Date().toISOString();
    const responseText = result.response.text();

    try {
      const analysis = JSON.parse(responseText) as GeminiPlantAnalysisResponse;
      return this.toPlantAiAnalysis(analysis, userObservation, analyzedAt);
    } catch (error) {
      this.logger.warn(
        `Gemini devolvió JSON inválido para una imagen: ${(error as Error).message}`,
      );

      return this.toPlantAiAnalysis(
        {
          estado: 'atencion',
          diagnostico:
            'No se pudo interpretar automáticamente la respuesta de IA.',
          recomendacion:
            'Revisá la imagen y la observación manualmente o reintentá el análisis.',
          confianza: 'baja',
        },
        userObservation,
        analyzedAt,
      );
    }
  }

  private getImageMimeType(imageResponse: Response): string {
    const contentType = imageResponse.headers
      .get('content-type')
      ?.split(';')[0];
    if (contentType?.startsWith('image/')) return contentType;
    return 'image/jpeg';
  }

  private getGenAI(): GoogleGenerativeAI {
    if (this.genAI) return this.genAI;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY no está configurada',
      );
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    return this.genAI;
  }

  private toPlantAiAnalysis(
    analysis: GeminiPlantAnalysisResponse,
    userNote: string | undefined,
    analyzedAt: string,
  ): PlantAiAnalysis {
    return {
      estado: analysis.estado,
      diagnostico: analysis.diagnostico,
      recomendacion: analysis.recomendacion,
      confianza: analysis.confianza,
      healthScore: this.getHealthScore(analysis.estado),
      confidence: this.getConfidenceScore(analysis.confianza),
      status: this.getStatus(analysis.estado),
      observations: [analysis.diagnostico],
      recommendations: [analysis.recomendacion],
      userNote,
      analyzedAt,
    };
  }

  private getHealthScore(
    estado: GeminiPlantAnalysisResponse['estado'],
  ): number {
    if (estado === 'sana') return 90;
    if (estado === 'atencion') return 65;
    return 35;
  }

  private getConfidenceScore(
    confianza: GeminiPlantAnalysisResponse['confianza'],
  ): number {
    if (confianza === 'alta') return 90;
    if (confianza === 'media') return 70;
    return 45;
  }

  private getStatus(estado: GeminiPlantAnalysisResponse['estado']): string {
    if (estado === 'sana') return 'Saludable';
    if (estado === 'atencion') return 'Atención recomendada';
    return 'Requiere cuidado urgente';
  }
}
