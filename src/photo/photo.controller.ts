import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FirebaseAuthGuard } from '../shared/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../shared/decorators/current-user.decorator';
import { UploadPhotoUseCase } from './usecases/upload-photo.usecase';
import { AnalyzePhotoUseCase } from './usecases/analyze-photo.usecase';
import { GetTimelineUseCase } from './usecases/get-timeline.usecase';

@Controller('photo')
@UseGuards(FirebaseAuthGuard)
export class PhotoController {
  constructor(
    private readonly uploadPhotoUseCase:   UploadPhotoUseCase,
    private readonly analyzePhotoUseCase:  AnalyzePhotoUseCase,
    private readonly getTimelineUseCase:   GetTimelineUseCase,
  ) {}

  // POST /photo/:userPlantId/upload?type=initial|report
  // Sube una foto de la planta — multipart/form-data con campo "file"
  @Post(':userPlantId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // buffer en memoria, Cloudinary recibe el buffer
      limits:  { fileSize: 10 * 1024 * 1024 }, // máximo 10MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Solo se permiten imágenes JPEG, PNG o WebP'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @Param('userPlantId', ParseIntPipe) userPlantId: number,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: string,
  ) {
    if (!file) {
      throw new BadRequestException('Se requiere un archivo de imagen (campo "file")');
    }

    const photoType = type === 'initial' ? 'initial' : 'report';

    const photo = await this.uploadPhotoUseCase.execute(
      userPlantId,
      file,
      photoType,
    );

    return {
      message: 'Foto subida exitosamente',
      data:    this.formatPhoto(photo),
    };
  }

  // POST /photo/:id/analyze
  // Dispara el análisis de IA de una foto existente — resultado guardado en BD
  @Post(':id/analyze')
  @HttpCode(HttpStatus.OK)
  async analyze(@Param('id', ParseIntPipe) id: number) {
    const analysis = await this.analyzePhotoUseCase.execute(id);
    return {
      message: 'Análisis completado exitosamente',
      data:    analysis,
    };
  }

  // GET /photo/:userPlantId/timeline
  // Línea de tiempo visual de fotos de la planta
  @Get(':userPlantId/timeline')
  async getTimeline(
    @Param('userPlantId', ParseIntPipe) userPlantId: number,
  ) {
    const photos = await this.getTimelineUseCase.execute(userPlantId);
    return {
      message: 'Historial de fotos obtenido',
      data:    photos.map(p => this.formatPhoto(p)),
      total:   photos.length,
    };
  }

  private formatPhoto(photo: any) {
    return {
      id:           photo.id,
      userPlantId:  photo.userPlantId,
      imageUrl:     photo.imageUrl,
      type:         photo.type,
      hasAnalysis:  photo.hasAnalysis(),
      aiAnalysis:   photo.aiAnalysis,
      healthSummary: photo.healthSummary(),
      takenAt:      photo.takenAt,
    };
  }
}
