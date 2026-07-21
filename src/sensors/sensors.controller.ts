import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { SensorsService } from './sensors.service';

@Controller('sensors')
@UseGuards(FirebaseAuthGuard)
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @Get('latest/:boxId')
  async getLatest(@Param('boxId', ParseIntPipe) boxId: number) {
    return this.sensorsService.getLatest(boxId);
  }

  @Get('history/:boxId/:period')
  async getHistory(
    @Param('boxId', ParseIntPipe) boxId: number,
    @Param('period') period: string,
  ) {
    return this.sensorsService.getHistory(boxId, period);
  }

  @Get('actuators/:boxId')
  async getActuators(@Param('boxId', ParseIntPipe) boxId: number) {
    return this.sensorsService.getActuatorStatus(boxId);
  }
}
