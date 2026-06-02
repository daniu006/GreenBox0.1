import { Controller,Get,Post,Patch,Delete,Body,Param,ParseIntPipe,UseGuards,HttpCode,HttpStatus,} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { GetAllPlantsUseCase } from './usecases/get-all-plants.usecase';
import { GetByCategoryUseCase } from './usecases/get-by-category.usecase';
import { GetPlantsUseCase } from './usecases/get-plant.usecase';
import { CreatePlantDto, UpdatePlantDto } from './plant.dto';
import { PlantPrismaRepository } from './plant.repository';

@Controller('plant')
export class PlantController {
  constructor(
    private readonly getAllPlantsUseCase: GetAllPlantsUseCase,
    private readonly getByCategoryUseCase: GetByCategoryUseCase,
    private readonly getPlantsUseCase: GetPlantsUseCase,
    private readonly plantRepository: PlantPrismaRepository,
  ) {}

  @Get()
  @UseGuards(FirebaseAuthGuard)
  async getAll() {
    const grouped = await this.getAllPlantsUseCase.execute();
    return {
      message: 'Catálogo de plantas obtenido exitosamente',
      data: grouped,
    };
  }

  @Get('category/:category')
  @UseGuards(FirebaseAuthGuard)
  async getByCategory(@Param('category') category: string) {
    const plants = await this.getByCategoryUseCase.execute(category);
    return {
      message: `Plantas de la categoría ${category} obtenidas exitosamente`,
      data: plants,
      total: plants.length,
    };
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const plant = await this.getPlantsUseCase.execute(id);
    return {
      message: 'Planta obtenida exitosamente',
      data: plant,
    };
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePlantDto) {
    const plant = await this.plantRepository.create(dto);
    return {
      message: 'Planta creada exitosamente',
      data: plant,
    };
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlantDto,
  ) {
    const exists = await this.plantRepository.exists(id);
    if (!exists) {
      return { message: `Planta con id ${id} no encontrada` };
    }
    const plant = await this.plantRepository.update(id, dto);
    return {
      message: 'Planta actualizada exitosamente',
      data: plant,
    };
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.plantRepository.delete(id);
    return { message: 'Planta eliminada exitosamente' };
  }
}