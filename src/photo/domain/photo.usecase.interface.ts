import { PlantPhoto, PlantAiAnalysis } from './photo.entity';
export interface IUploadPhotoUseCase {
  execute(
    userPlantId: number,
    file: Express.Multer.File,
    type: 'initial' | 'report',
  ): Promise<PlantPhoto>;
}
export interface IAnalyzePhotoUseCase {
  execute(photoId: number): Promise<PlantAiAnalysis>;
}
export interface IGetTimelineUseCase {
  execute(userPlantId: number): Promise<PlantPhoto[]>;
}
export const UPLOAD_PHOTO_USE_CASE  = 'UPLOAD_PHOTO_USE_CASE';
export const ANALYZE_PHOTO_USE_CASE = 'ANALYZE_PHOTO_USE_CASE';
export const GET_TIMELINE_USE_CASE  = 'GET_TIMELINE_USE_CASE';
