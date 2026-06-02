export class History {
  constructor(
    public readonly id: number,
    public readonly userPlantId: number,
    public readonly type: string,       // daily | weekly | monthly
    public readonly week: number,
    public readonly temperature: number,
    public readonly humidity: number,
    public readonly soilMoisture: number,
    public readonly lightHours: number,
    public readonly waterLevel: number,
    public readonly estimatedHealth: number,
    public readonly date: Date,
  ) {}

  healthLabel(): string {
    if (this.estimatedHealth >= 80) return 'Saludable';
    if (this.estimatedHealth >= 60) return 'Aceptable';
    if (this.estimatedHealth >= 40) return 'En riesgo';
    return 'Crítico';
  }
}

export const HISTORY_TYPES = ['daily', 'weekly', 'monthly'] as const;
export type HistoryType = typeof HISTORY_TYPES[number];
