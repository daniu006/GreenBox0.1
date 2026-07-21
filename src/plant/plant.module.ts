import { Module } from '@nestjs/common';
import { PlantController } from './plant.controller';
import { PlantService } from './plant.service';
import { PlantRepository } from './plant.repository';

@Module({
  controllers: [PlantController],
  providers: [PlantService, PlantRepository],
  exports: [PlantService, PlantRepository],
})
export class PlantModule {}
