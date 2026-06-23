import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config();
async function bootstrap() {
  if (admin.apps.length === 0) {
    const firebaseConfig = Buffer.from(
      process.env.FIREBASE_CONFIG_BASE64!,
      'base64',
    ).toString('utf-8');
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(firebaseConfig)),
    });
  }
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:        true,    
      forbidNonWhitelisted: true, 
      transform:        true,    
    }),
  );
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
