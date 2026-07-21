import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { StatisticService } from './statistic.service';

@Controller('statistic')
@UseGuards(FirebaseAuthGuard)
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get(':userPlantId/latest')
  async getLatest(@Param('userPlantId', ParseIntPipe) userPlantId: number) {
    const data = await this.statisticService.getLatest(userPlantId);
    return { message: 'Estadística más reciente obtenida', data };
  }

  @Get(':userPlantId/week')
  async getByWeek(
    @Param('userPlantId', ParseIntPipe) userPlantId: number,
    @Query('week', ParseIntPipe) week: number,
  ) {
    const data = await this.statisticService.getByWeek(userPlantId, week);
    return { message: `Estadística de la semana ${week} obtenida`, data };
  }

  @Get(':userPlantId')
  async getAll(@Param('userPlantId', ParseIntPipe) userPlantId: number) {
    const data = await this.statisticService.getAll(userPlantId);
    return {
      message: 'Estadísticas obtenidas exitosamente',
      data,
      total: data.length,
    };
  }

  @Post(':userPlantId/calculate')
  async calculate(@Param('userPlantId', ParseIntPipe) userPlantId: number) {
    const data = await this.statisticService.calculate(userPlantId);
    return { message: 'Estadísticas calculadas exitosamente', data };
  }
}
