import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUrl, Min, Max, IsIn, } from 'class-validator';

export class CreatePlantDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la planta es obligatorio' })
  name: string;

  
  @IsString()
  category: string;

  @IsOptional()
  @IsString({ message: 'La imagen debe ser una cadena de texto (URL o Base64)' })
  imageUrl?: string;

  @IsNumber({}, { message: 'La temperatura mínima debe ser un número' })
  @Min(-10, { message: 'La temperatura mínima no puede ser menor a -10°C' })
  @Max(50, { message: 'La temperatura mínima no puede ser mayor a 50°C' })
  minTemperature: number;

  @IsNumber({}, { message: 'La temperatura máxima debe ser un número' })
  @Min(-10, { message: 'La temperatura máxima no puede ser menor a -10°C' })
  @Max(50, { message: 'La temperatura máxima no puede ser mayor a 50°C' })
  maxTemperature: number;

  @IsNumber({}, { message: 'La humedad mínima debe ser un número' })
  @Min(0, { message: 'La humedad mínima no puede ser menor a 0%' })
  @Max(100, { message: 'La humedad mínima no puede ser mayor a 100%' })
  minHumidity: number;

  @IsNumber({}, { message: 'La humedad máxima debe ser un número' })
  @Min(0, { message: 'La humedad máxima no puede ser menor a 0%' })
  @Max(100, { message: 'La humedad máxima no puede ser mayor a 100%' })
  maxHumidity: number;

  @IsNumber({}, { message: 'Las horas de luz deben ser un número' })
  @Min(0, { message: 'Las horas de luz no pueden ser negativas' })
  @Max(24, { message: 'Las horas de luz no pueden ser más de 24' })
  lightHours: number;

  @IsNumber({}, { message: 'El nivel mínimo de agua debe ser un número' })
  @Min(0, { message: 'El nivel de agua no puede ser negativo' })
  @Max(100, { message: 'El nivel de agua no puede ser mayor a 100%' })
  minWaterLevel: number;

  @IsOptional()
  @IsNumber({}, { message: 'La humedad mínima del suelo debe ser un número' })
  @Min(0)
  @Max(100)
  minSoilMoisture?: number;

  @IsNumber({}, { message: 'La frecuencia de riego debe ser un número' })
  @Min(1, { message: 'La frecuencia de riego mínima es 1 día' })
  @Max(60, { message: 'La frecuencia de riego máxima es 60 días' })
  wateringFrequency: number;
}

export class UpdatePlantDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  category?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La imagen debe ser una URL válida' })
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(-10) @Max(50)
  minTemperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(-10) @Max(50)
  maxTemperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(0) @Max(100)
  minHumidity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0) @Max(100)
  maxHumidity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0) @Max(24)
  lightHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0) @Max(100)
  minWaterLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0) @Max(100)
  minSoilMoisture?: number;

  @IsOptional()
  @IsNumber()
  @Min(1) @Max(60)
  wateringFrequency?: number;
}

export class GetByCategoryDto {
  @IsString()
  category: string;
}