import { Module } from '@nestjs/common';
import { PlantController } from 'src/plant/plant.controller';
import { GetAllPlantsUseCase } from 'src/plant/usecases/get-all-plants.usecase';
import { GetByCategoryUseCase } from 'src/plant/usecases/get-by-category.usecase';
import { GetPlantsUseCase } from '../usecases/get-plant.usecase';
import { PlantPrismaRepository } from 'src/plant/plant.repository';
import { PLANT_REPOSITORY } from 'src/plant/domain/plant.repository.interface';

@Module({
  controllers: [PlantController],
  providers: [
    GetAllPlantsUseCase,
    GetByCategoryUseCase,
    GetPlantsUseCase,
    PlantPrismaRepository,
    {
      provide: PLANT_REPOSITORY,
      useClass: PlantPrismaRepository,
    },
  ],
  exports: [GetPlantsUseCase, PLANT_REPOSITORY],
})
export class PlantModule {}