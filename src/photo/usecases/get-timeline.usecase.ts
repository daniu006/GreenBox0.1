import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PHOTO_REPOSITORY, IPhotoRepository } from '../domain/photo.repository.interface';
import { PlantPhoto } from '../domain/photo.entity';
@Injectable()
export class GetTimelineUseCase {
  private readonly logger = new Logger(GetTimelineUseCase.name);
  constructor(
    @Inject(PHOTO_REPOSITORY)
    private readonly photoRepository: IPhotoRepository,
  ) {}
  async execute(userPlantId: number): Promise<PlantPhoto[]> {
    const photos = await this.photoRepository.findByUserPlant(userPlantId);
    this.logger.debug(
      `Timeline para userPlant ${userPlantId}: ${photos.length} fotos`,
    );
    return photos;
  }
}
