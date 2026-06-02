import { Module } from '@nestjs/common';
import { UserPlantController } from './user-plant.controller';
import { CreateUserPlantUseCase } from './usecases/create-user-plant.usecase';
import { GetUserPlantsUseCase } from './usecases/get-user-plants.usecase';
import { ArchiveUserPlantUseCase } from './usecases/archive-user-plant.usecase';
import { DeleteUserPlantUseCase } from './usecases/delete-user-plant.usecase';
import { UserPlantPrismaRepository } from './user-plant.repository';
import { USER_PLANT_REPOSITORY } from './domain/user-plant.repository.interface';
import { PlantModule } from '../plant/plant.module';
import { BoxModule } from '../box/box.module';

@Module({
  imports: [
    PlantModule, // necesita PLANT_REPOSITORY para validar que la planta existe
    BoxModule,   // necesita BOX_REPOSITORY para validar que el box pertenece al usuario
  ],
  controllers: [UserPlantController],
  providers: [
    CreateUserPlantUseCase,
    GetUserPlantsUseCase,
    ArchiveUserPlantUseCase,
    DeleteUserPlantUseCase,
    UserPlantPrismaRepository,
    {
      provide: USER_PLANT_REPOSITORY,
      useClass: UserPlantPrismaRepository,
    },
  ],
  exports: [USER_PLANT_REPOSITORY, GetUserPlantsUseCase],
})
export class UserPlantModule {}