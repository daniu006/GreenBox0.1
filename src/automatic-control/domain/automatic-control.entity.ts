// Entidad de dominio para el control automático
// Representa la decisión que toma el backend para responder al ESP32
// Nunca viene del frontend — el hardware solo manda lecturas y recibe comandos

export class ControlCommand {
  constructor(
    public readonly userPlantId: number,
    public readonly pump: boolean,       // activar/desactivar bomba de agua
    public readonly light: boolean,      // activar/desactivar luz artificial
    public readonly reason: string,      // motivo de la decisión (logging)
    public readonly evaluatedAt: Date,
  ) {}

  // Resumen legible — útil para logs y auditorías
  summary(): string {
    const parts: string[] = [];
    if (this.pump)  parts.push('Bomba ON');
    if (this.light) parts.push('Luz ON');
    if (parts.length === 0) parts.push('Sin actuadores activos');
    return `[userPlant ${this.userPlantId}] ${parts.join(', ')} — ${this.reason}`;
  }
}

// Parámetros de la planta que el backend usa para decidir
// Se obtienen de la BD, nunca del frontend ni del ESP32
export interface PlantThresholds {
  minTemperature: number;
  maxTemperature: number;
  minHumidity:    number;
  maxHumidity:    number;
  lightHours:     number;       // horas de luz que necesita al día
  minWaterLevel:  number;       // nivel mínimo de agua en el depósito (%)
  minSoilMoisture: number | null;
}

// Lectura que llega del ESP32 para ser evaluada
export interface SensorReading {
  temperature:  number;
  humidity:     number;
  soilMoisture: number;
  lightHours:   number;  // horas de luz acumuladas del día
  waterLevel:   number;  // nivel del depósito (%)
}
