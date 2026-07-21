import { Module } from '@nestjs/common';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { AlertRepository } from './alert.repository';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AlertController],
  providers: [AlertService, AlertRepository],
  exports: [AlertService],
})
export class AlertModule {}
