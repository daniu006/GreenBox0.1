import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseNotificationService {
  private readonly logger = new Logger(FirebaseNotificationService.name);

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      if (admin.apps.length === 0) {
        admin.initializeApp();
      }

      await admin.messaging().send({
        token,
        notification: {
          title,
          body,
        },
        data,
      });
      this.logger.log(`Push notification sent successfully to token: ${token}`);
    } catch (error: any) {
      this.logger.error(`Failed to send push notification to token: ${token}: ${error.message}`);
    }
  }
}
