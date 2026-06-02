import {Controller,Get,Patch,Delete,Param,ParseIntPipe,UseGuards,HttpCode,HttpStatus,} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from 'src/shared/decorators/current-user.decorator';
import { GetActiveAlertsUseCase } from './usecases/get-active-alerts.usecase';
import { ResolveAlertUseCase } from './usecases/resolve-alert.usecase';

@Controller('alert')
@UseGuards(FirebaseAuthGuard)
export class AlertController {
  constructor(
    private readonly getActiveAlertsUseCase: GetActiveAlertsUseCase,
    private readonly resolveAlertUseCase: ResolveAlertUseCase,
  ) {}

  // GET /alert/:userPlantId/active — alertas activas para el home y notificaciones
  @Get(':userPlantId/active')
  async getActive(@Param('userPlantId', ParseIntPipe) userPlantId: number) {
    const alerts = await this.getActiveAlertsUseCase.getActive(userPlantId);
    return {
      message: 'Alertas activas obtenidas',
      data: alerts.map(a => this.formatAlert(a)),
      total: alerts.length,
    };
  }

  // GET /alert/:userPlantId — todas las alertas incluyendo resueltas
  @Get(':userPlantId')
  async getAll(@Param('userPlantId', ParseIntPipe) userPlantId: number) {
    const alerts = await this.getActiveAlertsUseCase.getAll(userPlantId);
    return {
      message: 'Alertas obtenidas exitosamente',
      data: alerts.map(a => this.formatAlert(a)),
      total: alerts.length,
    };
  }

  // PATCH /alert/:id/resolve — marcar una alerta como resuelta
  @Patch(':id/resolve')
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const alert = await this.resolveAlertUseCase.resolve(id, user.uid);
    return {
      message: 'Alerta resuelta exitosamente',
      data: this.formatAlert(alert),
    };
  }

  // PATCH /alert/:userPlantId/resolve-all — marcar todas como resueltas
  @Patch(':userPlantId/resolve-all')
  @HttpCode(HttpStatus.OK)
  async resolveAll(
    @Param('userPlantId', ParseIntPipe) userPlantId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.resolveAlertUseCase.resolveAll(userPlantId, user.uid);
    return { message: 'Todas las alertas resueltas exitosamente' };
  }

  // DELETE /alert/:id — eliminar alerta
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.resolveAlertUseCase.delete(id, user.uid);
    return { message: 'Alerta eliminada exitosamente' };
  }

  private formatAlert(alert: any) {
    return {
      id: alert.id,
      userPlantId: alert.userPlantId,
      type: alert.type,
      typeLabel: alert.typeLabel(),
      message: alert.message,
      priority: alert.priority(),
      priorityLabel: alert.priorityLabel(),
      resolved: alert.resolved,
      createdAt: alert.createdAt,
    };
  }
}
