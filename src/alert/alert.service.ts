
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AlertRepository, Alert, ALERT_TYPES } from './alert.repository';
import { FirebaseNotificationService } from 'src/notifications/firebase-notification.service';

export interface AlertFormatted {
  id: number;
  userPlantId: number;
  type: string;
  typeLabel: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  priorityLabel: string;
  resolved: boolean;
  createdAt: Date;
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    private readonly alertRepository: AlertRepository,
    private readonly prisma: PrismaService,
    private readonly firebaseNotification: FirebaseNotificationService,
  ) {}

  async create(
    userPlantId: number,
    type: string,
    message: string,
  ): Promise<Alert | null> {
    if (!ALERT_TYPES.includes(type as any)) {
      this.logger.warn(`Tipo de alerta inválido: ${type}`);
      return null;
    }

    const existing = await this.alertRepository.findUnresolved(
      userPlantId,
      type,
    );
    if (existing) return null;

    // Evitar que la alerta reaparezca inmediatamente (Cooldown de 1 hora)
    const cooldownHours = 1;
    const cooldownTime = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);
    const recentAlert = await this.prisma.alert.findFirst({
      where: {
        userPlantId,
        type,
        createdAt: { gte: cooldownTime },
      },
    });

    if (recentAlert) {
      return null; // Silenciamos esta alerta por 1 hora
    }

    const alert = await this.alertRepository.create(userPlantId, type, message);
    await this.sendPushNotification(userPlantId, alert);
    return alert;
  }

  async getActive(userPlantId: number): Promise<AlertFormatted[]> {
    const alerts = await this.alertRepository.findActive(userPlantId);
    return alerts.map((a) => this.format(a));
  }

  async getAll(userPlantId: number): Promise<AlertFormatted[]> {
    const alerts = await this.alertRepository.findAll(userPlantId);
    return alerts.map((a) => this.format(a));
  }

  async resolve(id: number, userId: string): Promise<AlertFormatted> {
    const alert = await this.alertRepository.findById(id);
    if (!alert) throw new NotFoundException('Alerta no encontrada');

    await this.verifyOwnership(alert.userPlantId, userId);
    const resolved = await this.alertRepository.resolve(id);
    return this.format(resolved);
  }

  async resolveAll(userPlantId: number, userId: string): Promise<void> {
    await this.verifyOwnership(userPlantId, userId);
    await this.alertRepository.resolveAll(userPlantId);
  }

  async delete(id: number, userId: string): Promise<void> {
    const alert = await this.alertRepository.findById(id);
    if (!alert) throw new NotFoundException('Alerta no encontrada');

    await this.verifyOwnership(alert.userPlantId, userId);
    await this.alertRepository.delete(id);
  }

  private async verifyOwnership(
    userPlantId: number,
    userId: string,
  ): Promise<void> {
    const userPlant = await this.prisma.userPlant.findUnique({
      where: { id: userPlantId },
      select: { userId: true },
    });
    if (!userPlant || userPlant.userId !== userId) {
      throw new ForbiddenException('No tienes permiso sobre esta alerta');
    }
  }

  private async sendPushNotification(
    userPlantId: number,
    alert: Alert,
  ): Promise<void> {
    try {
      const userPlant = await this.prisma.userPlant.findUnique({
        where: { id: userPlantId },
        include: {
          box: { select: { fcmTokens: true } },
          plant: { select: { name: true } },
        },
      });
      if (!userPlant?.box?.fcmTokens?.length) return;

      const plantName = userPlant.plant?.name ?? 'Tu planta';
      const title = `⚠️ Alerta: ${this.getTypeLabel(alert.type)}`;
      const body = `${plantName} — ${alert.message}`;

      await Promise.all(
        userPlant.box.fcmTokens.map((token) =>
          this.firebaseNotification.sendPushNotification(token, title, body, {
            userPlantId: userPlantId.toString(),
            alertId: alert.id.toString(),
            type: alert.type,
            priority: this.getPriority(alert.type),
          }),
        ),
      );
    } catch (error) {
      this.logger.error('Error enviando notificación push', error);
    }
  }

  format(alert: Alert): AlertFormatted {
    const priority = this.getPriority(alert.type);
    return {
      id: alert.id,
      userPlantId: alert.userPlantId,
      type: alert.type,
      typeLabel: this.getTypeLabel(alert.type),
      message: alert.message,
      priority,
      priorityLabel: this.getPriorityLabel(priority),
      resolved: alert.resolved,
      createdAt: alert.createdAt,
    };
  }

  private getPriority(type: string): 'high' | 'medium' | 'low' {
    const high = ['water', 'soilMoisture', 'temperature'];
    const medium = ['humidity', 'light'];
    if (high.includes(type)) return 'high';
    if (medium.includes(type)) return 'medium';
    return 'low';
  }

  private getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
    const labels = { high: 'Alta', medium: 'Media', low: 'Baja' };
    return labels[priority];
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      temperature: 'Temperatura',
      humidity: 'Humedad',
      water: 'Nivel de agua',
      soilMoisture: 'Humedad del suelo',
      light: 'Luz',
    };
    return labels[type] ?? type;
  }
}
