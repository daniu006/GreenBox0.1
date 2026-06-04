import { IsIn } from 'class-validator';
import { PHOTO_TYPES } from './photo.repository';
export class UploadPhotoDto {
  @IsIn(PHOTO_TYPES, { message: 'El tipo de foto debe ser "initial" o "report"' })
  type: 'initial' | 'report';
}
export class AnalyzePhotoDto {
}
