import {Controller,Get,Post,Param,Query,ParseIntPipe,UseGuards,HttpCode,HttpStatus,} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { HistoryService } from './history.service';
import { HistoryType } from './history.repository';

@Controller('history')
@UseGuards(FirebaseAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get(':userPlantId')
  async getByPeriod(
    @Param('userPlantId', ParseIntPipe) userPlantId: number,
    @Query('period') period: string,
    @Query('date') date?: string,
  ) {
    const result = await this.historyService.getByPeriod(userPlantId, period, date);
    return {
      message: `Historial ${period} obtenido exitosamente`,
      data: result,
    };
  }

  @Post(':userPlantId/save')
  @HttpCode(HttpStatus.CREATED)
  async save(
    @Param('userPlantId', ParseIntPipe) userPlantId: number,
    @Query('type') type: string,
  ) {
    const history = await this.historyService.save(userPlantId, type as HistoryType);
    return {
      message: `Historial ${type} guardado exitosamente`,
      data: history,
    };
  }
}