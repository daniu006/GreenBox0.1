import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';
import { PhotoRepository } from './photo.repository';
import { CloudinaryService } from './cloudinary.service';
import { GeminiPlantAnalyzer } from './gemini-plant-analyzer';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule, MulterModule.register({ storage: memoryStorage() })],
  controllers: [PhotoController],
  providers: [
    PhotoService,
    PhotoRepository,
    CloudinaryService,
    GeminiPlantAnalyzer,
  ],
  exports: [PhotoService, PhotoRepository, CloudinaryService],
})
export class PhotoModule {}
