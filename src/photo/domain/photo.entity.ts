// Entidad de dominio para fotos de plantas
// Representa una foto guardada del progreso de una planta de un usuario

export class PlantPhoto {
  constructor(
    public readonly id:          number,
    public readonly userPlantId: number,
    public readonly imageUrl:    string,
    public readonly type:        PhotoType,
    public readonly aiAnalysis:  PlantAiAnalysis | null,
    public readonly takenAt:     Date,
  ) {}

  // Tiene análisis de IA guardado
  hasAnalysis(): boolean {
    return this.aiAnalysis !== null;
  }

  // Resumen legible de la salud según IA
  healthSummary(): string {
    if (!this.aiAnalysis) return 'Sin análisis';
    return `${this.aiAnalysis.healthScore}/100 — ${this.aiAnalysis.status}`;
  }
}

// Tipos de foto
export const PHOTO_TYPES = ['initial', 'report'] as const;
export type PhotoType = typeof PHOTO_TYPES[number];

// Análisis de IA guardado como JSON en la BD
// El frontend solo muestra, nunca calcula esto
export interface PlantAiAnalysis {
  healthScore:   number;        // 0–100
  status:        string;        // 'saludable' | 'estrés' | 'enfermedad' | etc.
  observations:  string[];      // observaciones detectadas por la IA
  recommendations: string[];    // recomendaciones de cuidado
  analyzedAt:    string;        // ISO timestamp del análisis
}
