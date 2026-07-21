import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from 'src/shared/decorators/current-user.decorator';
import { UserPlantService } from './user-plant.service';
import { CreateUserPlantDto } from './user-plant.dto';

@Controller('user-plant')
@UseGuards(FirebaseAuthGuard)
export class UserPlantController {
  constructor(private readonly userPlantService: UserPlantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateUserPlantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.userPlantService.create(dto, user.uid);
    return { message: 'Planta agregada exitosamente', data };
  }

  @Get()
  async getActive(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.userPlantService.getActive(user.uid);
    return {
      message: 'Plantas activas obtenidas exitosamente',
      data,
      total: data.length,
    };
  }

  @Get('all')
  async getAll(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.userPlantService.getAll(user.uid);
    return {
      message: 'Todas las plantas obtenidas exitosamente',
      data,
      total: data.length,
    };
  }

  @Patch(':id/archive')
  async archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.userPlantService.archive(id, user.uid);
    return { message: 'Planta archivada exitosamente', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.userPlantService.delete(id, user.uid);
    return { message: 'Planta y todos sus datos eliminados exitosamente' };
  }
}
