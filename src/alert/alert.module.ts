import { Module } from '@nestjs/common';
import { AlertController } from './alert.controller';
import { CreateAlertUseCase } from './usecases/create-alert.usecase';
import { GetActiveAlertsUseCase } from './usecases/get-active-alerts.usecase';
import { ResolveAlertUseCase } from './usecases/resolve-alert.usecase';
import { AlertPrismaRepository } from './alert.repository';
import { ALERT_REPOSITORY } from './domain/alert.repository.interface';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AlertController],
  providers: [
    CreateAlertUseCase,
    GetActiveAlertsUseCase,
    ResolveAlertUseCase,
    AlertPrismaRepository,
    {
      provide: ALERT_REPOSITORY,
      useClass: AlertPrismaRepository,
    },
  ],
  exports: [CreateAlertUseCase, ALERT_REPOSITORY],
})
export class AlertModule {}