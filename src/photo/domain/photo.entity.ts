export class PlantPhoto {
  constructor(
    public readonly id:          number,
    public readonly userPlantId: number,
    public readonly imageUrl:    string,
    public readonly type:        PhotoType,
    public readonly aiAnalysis:  PlantAiAnalysis | null,
    public readonly takenAt:     Date,
  ) {}
  hasAnalysis(): boolean {
    return this.aiAnalysis !== null;
  }
  healthSummary(): string {
    if (!this.aiAnalysis) return 'Sin análisis';
    return `${this.aiAnalysis.healthScore}/100 — ${this.aiAnalysis.status}`;
  }
}
export const PHOTO_TYPES = ['initial', 'report'] as const;
export type PhotoType = typeof PHOTO_TYPES[number];
export interface PlantAiAnalysis {
  healthScore:   number;        
  status:        string;        
  observations:  string[];      
  recommendations: string[];    
  analyzedAt:    string;        
}
