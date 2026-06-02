export class Alert {
  constructor(
    public readonly id: number,
    public readonly userPlantId: number,
    public readonly type: string,
    public readonly message: string,
    public readonly resolved: boolean,
    public readonly createdAt: Date,
  ) {}

  // Prioridad calculada en el dominio según el tipo — nunca viene del frontend
  priority(): 'high' | 'medium' | 'low' {
    const highPriority = ['water', 'soilMoisture', 'temperature'];
    const mediumPriority = ['humidity', 'light'];
    if (highPriority.includes(this.type)) return 'high';
    if (mediumPriority.includes(this.type)) return 'medium';
    return 'low';
  }

  priorityLabel(): string {
    const labels = { high: 'Alta', medium: 'Media', low: 'Baja' };
    return labels[this.priority()];
  }

  typeLabel(): string {
    const labels: Record<string, string> = {
      temperature:  'Temperatura',
      humidity:     'Humedad',
      water:        'Nivel de agua',
      soilMoisture: 'Humedad del suelo',
      light:        'Luz',
    };
    return labels[this.type] ?? this.type;
  }
}

// Tipos válidos — definidos en el backend, nunca en el frontend
export const ALERT_TYPES = [
  'temperature',
  'humidity',
  'water',
  'soilMoisture',
  'light',
] as const;

export type AlertType = typeof ALERT_TYPES[number];