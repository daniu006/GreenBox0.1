import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { BoxModule } from '../box/box.module';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [BoxModule, PrismaModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService],
})
export class AuthModule {}