import { Module } from '@nestjs/common';
import { ReadingController } from './reading.controller';
import { ReadingService } from './reading.service';
import { ReadingRepository } from './reading.repository';
import { AlertModule } from 'src/alert/alert.module';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports:     [PrismaModule, AlertModule],
  controllers: [ReadingController],
  providers:   [ReadingService, ReadingRepository],
  exports:     [ReadingService, ReadingRepository],
})
export class ReadingModule {}