import {Controller,Get,Post,Patch,Delete,Body,Param,ParseIntPipe,UseGuards,HttpCode,HttpStatus,} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { PlantService } from './plant.service';
import { CreatePlantDto, UpdatePlantDto } from './plant.dto';

@Controller('plant')
@UseGuards(FirebaseAuthGuard)
export class PlantController {
  constructor(private readonly plantService: PlantService) {}

  @Get()
  async getAll() {
    const data = await this.plantService.getAll();
    return { message: 'Catálogo de plantas obtenido exitosamente', data };
  }

  @Get('category/:category')
  async getByCategory(@Param('category') category: string) {
    const data = await this.plantService.getByCategory(category);
    return {
      message: `Plantas de la categoría ${category} obtenidas exitosamente`,
      data,
      total: data.length,
    };
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.plantService.getById(id);
    return { message: 'Planta obtenida exitosamente', data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePlantDto) {
    const data = await this.plantService.create(dto);
    return { message: 'Planta creada exitosamente', data };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlantDto,
  ) {
    const data = await this.plantService.update(id, dto);
    return { message: 'Planta actualizada exitosamente', data };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.plantService.delete(id);
    return { message: 'Planta eliminada exitosamente' };
  }
}