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
  Req,
} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { ReadingService, Period } from './reading.service';
import { CreateReadingDto, SensorDataWsDto } from './reading.dto';
import { WebsocketService } from 'src/websocket/websocket.service';

@Controller('reading')
export class ReadingController {
  constructor(
    private readonly readingService: ReadingService,
    private readonly websocketService: WebsocketService,
  ) {}

  @Post('device')
  async handleDeviceData(@Body() data: SensorDataWsDto) {
    return this.websocketService.handleSensorData(data);
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
    const result = await this.readingService.getByPeriod(
      userPlantId,
      period as Period,
      date,
    );
    return {
      message: `Lecturas del período ${period} obtenidas exitosamente`,
      data: result,
    };
  }
}
