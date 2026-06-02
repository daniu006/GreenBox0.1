import { Controller, Get, Post, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { SaveHistoryUseCase } from './usecases/save-history.usecase';
import { GetHistoryByPeriodUseCase } from './usecases/get-history-by-period.usecase';
import { HistoryType } from './domain/history.entity';

@Controller('history')
@UseGuards(FirebaseAuthGuard)
export class HistoryController {
  constructor(
    private readonly saveHistoryUseCase: SaveHistoryUseCase,
    private readonly getHistoryByPeriodUseCase: GetHistoryByPeriodUseCase,
  ) {}

  // GET /history/:userPlantId?period=daily&date=2025-05-25
  // Historial para gráfica lineal — día, semana o mes
  @Get(':userPlantId')
  async getByPeriod(
    @Param('userPlantId', ParseIntPipe) userPlantId: number,
    @Query('period') period: string,
    @Query('date') date?: string,
  ) {
    const result = await this.getHistoryByPeriodUseCase.execute(
      userPlantId,
      period,
      date,
    );

    return {
      message: `Historial ${period} obtenido exitosamente`,
      data: {
        records: result.records.map(r => ({
          ...r,
          healthLabel: r.healthLabel(),
          // Etiqueta para el eje X según el período
          xLabel: this.getXLabel(r.date, period),
        })),
        peaks: result.peaks,
        total: result.records.length,
      },
    };
  }

  // POST /history/:userPlantId/save?type=daily
  // Guarda snapshot del período actual — se puede llamar manualmente
  @Post(':userPlantId/save')
  @HttpCode(HttpStatus.CREATED)
  async save(
    @Param('userPlantId', ParseIntPipe) userPlantId: number,
    @Query('type') type: string,
  ) {
    const history = await this.saveHistoryUseCase.execute(
      userPlantId,
      type as HistoryType,
    );

    return {
      message: `Historial ${type} guardado exitosamente`,
      data: { ...history, healthLabel: history.healthLabel() },
    };
  }

  private getXLabel(date: Date, period: string): string {
    if (period === 'daily') {
      // Día → hora: "14:30"
      return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    } else if (period === 'weekly') {
      // Semana → fecha y hora: "Lun 20 14:30"
      return date.toLocaleDateString('es-EC', { weekday: 'short', day: '2-digit' })
        + ' ' + date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    } else {
      // Mes → día: "20 May"
      return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
    }
  }
}