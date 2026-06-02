export class ControlCommand {
  constructor(
    public readonly userPlantId: number,
    public readonly pump: boolean,       
    public readonly light: boolean,      
    public readonly reason: string,      
    public readonly evaluatedAt: Date,
  ) {}
  summary(): string {
    const parts: string[] = [];
    if (this.pump)  parts.push('Bomba ON');
    if (this.light) parts.push('Luz ON');
    if (parts.length === 0) parts.push('Sin actuadores activos');
    return `[userPlant ${this.userPlantId}] ${parts.join(', ')} — ${this.reason}`;
  }
}
export interface PlantThresholds {
  minTemperature: number;
  maxTemperature: number;
  minHumidity:    number;
  maxHumidity:    number;
  lightHours:     number;       
  minWaterLevel:  number;       
  minSoilMoisture: number | null;
}
export interface SensorReading {
  temperature:  number;
  humidity:     number;
  soilMoisture: number;
  lightHours:   number;  
  waterLevel:   number;  
}
