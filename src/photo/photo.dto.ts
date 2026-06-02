import { IsString, IsIn, IsOptional } from 'class-validator';
import { PHOTO_TYPES } from './domain/photo.entity';
export class UploadPhotoDto {
  @IsIn(PHOTO_TYPES, { message: 'El tipo de foto debe ser "initial" o "report"' })
  type: 'initial' | 'report';
}
export class AnalyzePhotoDto {
}
