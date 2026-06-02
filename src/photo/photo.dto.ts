import { IsString, IsIn, IsOptional } from 'class-validator';
import { PHOTO_TYPES } from './domain/photo.entity';

export class UploadPhotoDto {
  @IsIn(PHOTO_TYPES, { message: 'El tipo de foto debe ser "initial" o "report"' })
  type: 'initial' | 'report';
}

export class AnalyzePhotoDto {
  // Sin campos adicionales — la foto se identifica por el ID en la URL
  // El análisis de IA se dispara en el backend, no viene del cliente
}
