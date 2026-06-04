import { Controller, Post, Get, Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus, } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { ReadingService, Period } from './reading.service';
import { CreateReadingDto } from './reading.dto';

@Controller('reading')
export class ReadingController {
  constructor(private readonly readingService: ReadingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateReadingDto) {
    const result = await this.readingService.create(dto);
    return {
      message: 'Lectura procesada exitosamente',
      data: result.reading,
      commands: result.commands,
    };
  }

  @Get(':userPlantId/latest')
  @UseGuards(FirebaseAuthGuard)
  async getLatest(@Param('userPlantId', ParseIntPipe) userPlantId: number) {
    const data = await this.readingService.getLatest(userPlantId);
    return { message: 'Última lectura obtenida', data: data ?? null };
  }

  @Get(':userPlantId/period')
  @UseGuards(FirebaseAuthGuard)
  async getByPeriod(
    @Param('userPlantId', ParseIntPipe) userPlantId: number,
    @Query('period') period: string,
    @Query('date') date?: string,
  ) {
    const result = await this.readingService.getByPeriod(userPlantId, period as Period, date);
    return {
      message: `Lecturas del período ${period} obtenidas exitosamente`,
      data: result,
    };
  }
}