import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PHOTO_REPOSITORY, IPhotoRepository } from '../domain/photo.repository.interface';
import { PlantPhoto } from '../domain/photo.entity';

/**
 * GetTimelineUseCase
 *
 * Retorna el historial de fotos de una planta del usuario ordenadas por fecha.
 * Permite al app mostrar la "línea de tiempo visual" del progreso de la planta.
 *
 * Incluye las fotos con su análisis de IA si ya fue generado.
 */
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
