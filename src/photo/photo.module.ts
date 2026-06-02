import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PhotoController } from './photo.controller';
import { UploadPhotoUseCase } from './usecases/upload-photo.usecase';
import { AnalyzePhotoUseCase } from './usecases/analyze-photo.usecase';
import { GetTimelineUseCase } from './usecases/get-timeline.usecase';
import { PhotoPrismaRepository } from './photo.repository';
import { CloudinaryService } from './firebase-storage.service';
import { PHOTO_REPOSITORY } from './domain/photo.repository.interface';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [PhotoController],
  providers: [
    UploadPhotoUseCase,
    AnalyzePhotoUseCase,
    GetTimelineUseCase,
    CloudinaryService,
    PhotoPrismaRepository,
    {
      provide: PHOTO_REPOSITORY,
      useClass: PhotoPrismaRepository,
    },
  ],
  exports: [UploadPhotoUseCase, PHOTO_REPOSITORY],
})
export class PhotoModule {}
