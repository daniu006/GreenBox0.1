import {Controller,Post,Get,Param,Body,ParseIntPipe,UseGuards,UseInterceptors,UploadedFile,Query,HttpCode,HttpStatus,BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { PhotoService } from './photo.service';

@Controller('photo')
@UseGuards(FirebaseAuthGuard)
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post(':userPlantId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
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
    const data = await this.photoService.upload(userPlantId, file, photoType);
    return { message: 'Foto subida exitosamente', data };
  }

  @Post(':id/analyze')
  @HttpCode(HttpStatus.OK)
  async analyze(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userNote?: string; plantName?: string },
  ) {
    const data = await this.photoService.analyze(id, body?.userNote, body?.plantName);
    return { message: 'Análisis completado exitosamente', data };
  }

  @Get(':userPlantId/timeline')
  async getTimeline(@Param('userPlantId', ParseIntPipe) userPlantId: number) {
    const data = await this.photoService.getTimeline(userPlantId);
    return { message: 'Historial de fotos obtenido', data, total: data.length };
  }
}