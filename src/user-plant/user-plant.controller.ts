import {Controller, Post, Get, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus,} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from 'src/shared/decorators/current-user.decorator';
import { CreateUserPlantUseCase } from './usecases/create-user-plant.usecase';
import { GetUserPlantsUseCase } from './usecases/get-user-plants.usecase';
import { ArchiveUserPlantUseCase } from './usecases/archive-user-plant.usecase';
import { DeleteUserPlantUseCase } from './usecases/delete-user-plant.usecase';
import { CreateUserPlantDto } from './user-plant.dto';

@Controller('user-plant')
@UseGuards(FirebaseAuthGuard)
export class UserPlantController {
  constructor(
    private readonly createUserPlantUseCase: CreateUserPlantUseCase,
    private readonly getUserPlantsUseCase: GetUserPlantsUseCase,
    private readonly archiveUserPlantUseCase: ArchiveUserPlantUseCase,
    private readonly deleteUserPlantUseCase: DeleteUserPlantUseCase,
  ) {}

  // POST /user-plant — crear nueva instancia de planta (empieza desde cero)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateUserPlantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const userPlant = await this.createUserPlantUseCase.execute(dto, user.uid);
    return {
      message: 'Planta agregada exitosamente',
      data: this.formatUserPlant(userPlant),
    };
  }

  // GET /user-plant — todas las plantas activas del usuario (para el home)
  @Get()
  async getActive(@CurrentUser() user: CurrentUserPayload) {
    const userPlants = await this.getUserPlantsUseCase.getActive(user.uid);
    return {
      message: 'Plantas activas obtenidas exitosamente',
      data: userPlants.map(up => this.formatUserPlant(up)),
      total: userPlants.length,
    };
  }

  // GET /user-plant/all — todas incluyendo archivadas (para historial)
  @Get('all')
  async getAll(@CurrentUser() user: CurrentUserPayload) {
    const userPlants = await this.getUserPlantsUseCase.getAll(user.uid);
    return {
      message: 'Todas las plantas obtenidas exitosamente',
      data: userPlants.map(up => this.formatUserPlant(up)),
      total: userPlants.length,
    };
  }

  // PATCH /user-plant/:id/archive — archivar sin borrar datos
  @Patch(':id/archive')
  async archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const userPlant = await this.archiveUserPlantUseCase.execute(id, user.uid);
    return {
      message: 'Planta archivada exitosamente',
      data: this.formatUserPlant(userPlant),
    };
  }

  // DELETE /user-plant/:id — eliminar solo si el usuario lo decide
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.deleteUserPlantUseCase.execute(id, user.uid);
    return { message: 'Planta y todos sus datos eliminados exitosamente' };
  }

  private formatUserPlant(up: any) {
    return {
      id: up.id,
      boxId: up.boxId,
      nickname: up.nickname,
      displayName: up.displayName(),
      status: up.status,
      isActive: up.isActive(),
      startedAt: up.startedAt,
      archivedAt: up.archivedAt,
      plant: up.plant
        ? {
            id: up.plant.id,
            name: up.plant.name,
            category: up.plant.category,
            imageUrl: up.plant.imageUrl,
            minTemperature: up.plant.minTemperature,
            maxTemperature: up.plant.maxTemperature,
            minHumidity: up.plant.minHumidity,
            maxHumidity: up.plant.maxHumidity,
            lightHours: up.plant.lightHours,
            minWaterLevel: up.plant.minWaterLevel,
            minSoilMoisture: up.plant.minSoilMoisture,
            wateringFrequency: up.plant.wateringFrequency,
          }
        : null,
    };
  }
}