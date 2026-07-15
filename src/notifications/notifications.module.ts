import { forwardRef, Module } from '@nestjs/common';
import { FirebaseNotificationService } from './firebase-notification.service';
import { NotificationsController } from './notifications.controller';
import { AlertModule } from 'src/alert/alert.module';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [forwardRef(() => AlertModule), PrismaModule],
  controllers: [NotificationsController],
  providers: [FirebaseNotificationService],
  exports: [FirebaseNotificationService],
})
export class NotificationsModule {}
