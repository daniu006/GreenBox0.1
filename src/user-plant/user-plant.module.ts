import { Module } from '@nestjs/common';
import { UserPlantController } from './user-plant.controller';
import { UserPlantService } from './user-plant.service';
import { UserPlantRepository } from './user-plant.repository';
import { PlantModule } from 'src/plant/plant.module';
import { BoxModule } from 'src/box/box.module';

@Module({
  imports: [PlantModule, BoxModule],
  controllers: [UserPlantController],
  providers: [UserPlantService, UserPlantRepository],
  exports: [UserPlantService, UserPlantRepository],
})
export class UserPlantModule {}