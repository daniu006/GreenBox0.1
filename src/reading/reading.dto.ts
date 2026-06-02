import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

// DTO que llega del ESP32 — toda validación aquí, no en el dispositivo
export class CreateReadingDto {
  @IsNumber({}, { message: 'El id de la planta debe ser un número' })
  @IsNotEmpty()
  userPlantId: number;

  @IsNumber({}, { message: 'La temperatura debe ser un número' })
  @Min(-20, { message: 'Temperatura fuera de rango sensor' })
  @Max(80, { message: 'Temperatura fuera de rango sensor' })
  temperature: number;

  @IsNumber({}, { message: 'La humedad debe ser un número' })
  @Min(0, { message: 'La humedad no puede ser negativa' })
  @Max(100, { message: 'La humedad no puede superar 100%' })
  humidity: number;

  @IsNumber({}, { message: 'La humedad del suelo debe ser un número' })
  @Min(0)
  @Max(100)
  soilMoisture: number;

  @IsNumber({}, { message: 'Las horas de luz deben ser un número' })
  @Min(0)
  @Max(24)
  lightHours: number;

  @IsNumber({}, { message: 'El nivel de agua debe ser un número' })
  @Min(0)
  @Max(100)
  waterLevel: number;
}

export class GetReadingsByPeriodDto {
  // Período: day | week | month — validado en backend
  period: 'day' | 'week' | 'month';
  date?: string; // ISO string opcional, si no se usa la fecha actual
}