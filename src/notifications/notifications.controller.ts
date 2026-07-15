import { Controller, Get, Patch, Delete, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from 'src/shared/decorators/current-user.decorator';
import { AlertService } from 'src/alert/alert.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationsController {
  constructor(
    private readonly alertService: AlertService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':id')
  async getNotifications(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const userPlantId = await this.resolveUserPlantId(id, user.uid);
    if (!userPlantId) return [];

    const alerts = await this.alertService.getAll(userPlantId);

    return alerts.map(alert => ({
      id: String(alert.id),
      type: alert.type === 'water' || alert.type === 'soilMoisture' ? 'reminder' : 'alert',
      priority: alert.type === 'water' ? 'medium' : 'high',
      title: this.getAlertTitle(alert.type),
      message: alert.message,
      timestamp: alert.createdAt.toISOString(),
      read: alert.resolved,
      sensorType: alert.type === 'soilMoisture' ? 'humidity' : alert.type,
    }));
  }

  @Get(':boxId/active')
  async getActiveNotifications(
    @Param('boxId', ParseIntPipe) boxId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const userPlant = await this.prisma.userPlant.findFirst({
      where: { boxId, userId: user.uid, archivedAt: null },
    });
    if (!userPlant) return [];

    const alerts = await this.alertService.getActive(userPlant.id);
    return alerts.map(alert => ({
      id: String(alert.id),
      type: 'alert',
      priority: 'high',
      title: this.getAlertTitle(alert.type),
      message: alert.message,
      timestamp: alert.createdAt.toISOString(),
      read: alert.resolved,
      sensorType: alert.type,
    }));
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.alertService.resolve(id, user.uid);
    return { success: true };
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    @Body() dto: { plantId: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const userPlantId = await this.resolveUserPlantId(dto.plantId, user.uid);
    if (userPlantId) {
      await this.alertService.resolveAll(userPlantId, user.uid);
    }
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async dismissNotification(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.alertService.delete(id, user.uid);
    return { success: true };
  }

  private async resolveUserPlantId(id: string, userId: string): Promise<number | null> {
    const numericId = parseInt(id, 10);
    
    if (!isNaN(numericId)) {
      const up = await this.prisma.userPlant.findFirst({
        where: { id: numericId, userId },
      });
      if (up) return up.id;
    }

    if (!isNaN(numericId)) {
      const up = await this.prisma.userPlant.findFirst({
        where: { boxId: numericId, userId, archivedAt: null },
      });
      if (up) return up.id;
    }

    if (!isNaN(numericId)) {
      const up = await this.prisma.userPlant.findFirst({
        where: { plantId: numericId, userId, archivedAt: null },
      });
      if (up) return up.id;
    }

    return null;
  }

  private getAlertTitle(type: string): string {
    switch (type) {
      case 'temperature': return 'Alerta de Temperatura';
      case 'humidity': return 'Alerta de Humedad';
      case 'water': return 'Nivel de Agua Bajo';
      case 'soilMoisture': return 'Humedad de Suelo Baja';
      default: return 'Alerta de GREENBOX';
    }
  }
}
