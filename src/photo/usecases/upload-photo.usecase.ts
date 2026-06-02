import {
  Inject,
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PHOTO_REPOSITORY, IPhotoRepository } from '../domain/photo.repository.interface';
import { CloudinaryService } from '../firebase-storage.service';
import { PlantPhoto } from '../domain/photo.entity';

/**
 * UploadPhotoUseCase
 *
 * Sube una foto de la planta del usuario:
 *  1. Valida que el userPlant existe (la planta debe estar activa)
 *  2. Sube el buffer de la imagen a Cloudinary con optimización automática
 *  3. Guarda el registro en la BD con la URL pública
 *
 * El frontend envía el archivo multipart/form-data.
 * El backend sube a Cloudinary — el cliente nunca toca Cloudinary directamente.
 */
@Injectable()
export class UploadPhotoUseCase {
  private readonly logger = new Logger(UploadPhotoUseCase.name);

  // Máximo de fotos por planta (evitar abuso de storage)
  private static readonly MAX_PHOTOS_PER_PLANT = 50;

  constructor(
    @Inject(PHOTO_REPOSITORY)
    private readonly photoRepository: IPhotoRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    userPlantId: number,
    file: Express.Multer.File,
    type: 'initial' | 'report',
  ): Promise<PlantPhoto> {
    // 1. Verificar límite de fotos
    const count = await this.photoRepository.countByUserPlant(userPlantId);
    if (count >= UploadPhotoUseCase.MAX_PHOTOS_PER_PLANT) {
      throw new BadRequestException(
        `Límite de ${UploadPhotoUseCase.MAX_PHOTOS_PER_PLANT} fotos por planta alcanzado`,
      );
    }

    // 2. Subir a Cloudinary con folder organizado por userPlantId
    const folder   = `greenbox/plants/${userPlantId}`;
    const publicId = `${type}-${Date.now()}`;

    const imageUrl = await this.cloudinaryService.uploadBuffer(
      file.buffer,
      folder,
      publicId,
    );

    // 3. Guardar en BD
    const photo = await this.photoRepository.create({
      userPlantId,
      imageUrl,
      type,
      aiAnalysis: null,
    });

    this.logger.log(
      `Foto ${type} subida para userPlant ${userPlantId} — ${imageUrl}`,
    );

    return photo;
  }
}
