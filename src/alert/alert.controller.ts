import {Controller,Get,Patch,Delete,Param,ParseIntPipe,UseGuards,HttpCode,HttpStatus,} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from 'src/shared/decorators/current-user.decorator';
import { AlertService } from './alert.service';

@Controller('alert')
@UseGuards(FirebaseAuthGuard)
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get(':userPlantId/active')
  async getActive(@Param('userPlantId', ParseIntPipe) userPlantId: number) {
    const alerts = await this.alertService.getActive(userPlantId);
    return { message: 'Alertas activas obtenidas', data: alerts, total: alerts.length };
  }

  @Get(':userPlantId')
  async getAll(@Param('userPlantId', ParseIntPipe) userPlantId: number) {
    const alerts = await this.alertService.getAll(userPlantId);
    return { message: 'Alertas obtenidas exitosamente', data: alerts, total: alerts.length };
  }

  @Patch(':id/resolve')
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const alert = await this.alertService.resolve(id, user.uid);
    return { message: 'Alerta resuelta exitosamente', data: alert };
  }

  @Patch(':userPlantId/resolve-all')
  @HttpCode(HttpStatus.OK)
  async resolveAll(
    @Param('userPlantId', ParseIntPipe) userPlantId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.alertService.resolveAll(userPlantId, user.uid);
    return { message: 'Todas las alertas resueltas exitosamente' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.alertService.delete(id, user.uid);
    return { message: 'Alerta eliminada exitosamente' };
  }
}