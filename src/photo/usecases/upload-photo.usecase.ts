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
@Injectable()
export class UploadPhotoUseCase {
  private readonly logger = new Logger(UploadPhotoUseCase.name);
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
    const count = await this.photoRepository.countByUserPlant(userPlantId);
    if (count >= UploadPhotoUseCase.MAX_PHOTOS_PER_PLANT) {
      throw new BadRequestException(
        `Límite de ${UploadPhotoUseCase.MAX_PHOTOS_PER_PLANT} fotos por planta alcanzado`,
      );
    }
    const folder   = `greenbox/plants/${userPlantId}`;
    const publicId = `${type}-${Date.now()}`;
    const imageUrl = await this.cloudinaryService.uploadBuffer(
      file.buffer,
      folder,
      publicId,
    );
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
