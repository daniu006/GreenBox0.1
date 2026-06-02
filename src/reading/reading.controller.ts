import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../shared/guards/firebase-auth.guard';
import { CreateReadingUseCase } from './usecases/create-reading.usecase';
import { GetReadingsByPeriodUseCase, Period } from './usecases/get-readings-by-period.usecase';
import { CreateReadingDto } from './reading.dto';

@Controller('reading')
export class ReadingController {
  constructor(
    private readonly createReadingUseCase: CreateReadingUseCase,
    private readonly getReadingsByPeriodUseCase: GetReadingsByPeriodUseCase,
  ) {}

  // POST /reading — recibe lecturas del ESP32 (sin guard, viene del hardware)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateReadingDto) {
    const result = await this.createReadingUseCase.execute(dto);
    return {
      message: 'Lectura procesada exitosamente',
      data: result.reading,
      commands: result.commands, // { pump: true/false } — respuesta al ESP32
    };
  }

  // GET /reading/:userPlantId/latest — última lectura para el home
  @Get(':userPlantId/latest')
  @UseGuards(FirebaseAuthGuard)
  async getLatest(@Param('userPlantId', ParseIntPipe) userPlantId: number) {
    const reading = await this.getReadingsByPeriodUseCase['readingRepository']
      ?.findLatest(userPlantId);
    return {
      message: 'Última lectura obtenida',
      data: reading ?? null,
    };
  }

  // GET /reading/:userPlantId/period?period=day&date=2025-05-25
  // Para el historial con gráfica lineal — día, semana o mes
  @Get(':userPlantId/period')
  @UseGuards(FirebaseAuthGuard)
  async getByPeriod(
    @Param('userPlantId', ParseIntPipe) userPlantId: number,
    @Query('period') period: string,
    @Query('date') date?: string,
  ) {
    const result = await this.getReadingsByPeriodUseCase.execute(
      userPlantId,
      period as Period,
      date,
    );

    return {
      message: `Lecturas del período ${period} obtenidas exitosamente`,
      data: {
        readings: result.readings,
        peaks: result.peaks,   // picos con fecha — para la info debajo de la gráfica
        total: result.readings.length,
      },
    };
  }
}