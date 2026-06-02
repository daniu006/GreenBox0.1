export class Plant {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly category: string,
    public readonly imageUrl: string | null,
    public readonly minTemperature: number,
    public readonly maxTemperature: number,
    public readonly minHumidity: number,
    public readonly maxHumidity: number,
    public readonly lightHours: number,
    public readonly minWaterLevel: number,
    public readonly minSoilMoisture: number | null,
    public readonly wateringFrequency: number,
    public readonly createdAt: Date,
  ) {}

  // Verifica si un valor de temperatura está en rango óptimo
  isTemperatureOptimal(value: number): boolean {
    return value >= this.minTemperature && value <= this.maxTemperature;
  }

  // Verifica si un valor de humedad está en rango óptimo
  isHumidityOptimal(value: number): boolean {
    return value >= this.minHumidity && value <= this.maxHumidity;
  }

  // Verifica si el nivel de agua está en rango óptimo
  isWaterLevelOptimal(value: number): boolean {
    return value >= this.minWaterLevel;
  }

  // Verifica si la humedad del suelo está en rango óptimo
  isSoilMoistureOptimal(value: number): boolean {
    if (this.minSoilMoisture === null) return true;
    return value >= this.minSoilMoisture;
  }
}

// Categorías válidas — definidas en el backend, nunca en el frontend
export const PLANT_CATEGORIES = [
  'interior',
  'comestible',
  'ornamental',
  'suculenta',
  'arbol',
] as const;

export type PlantCategory = typeof PLANT_CATEGORIES[number];