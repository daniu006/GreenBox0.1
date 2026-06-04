import { Module } from '@nestjs/common';
import { ReadingController } from './reading.controller';
import { ReadingService } from './reading.service';
import { ReadingRepository } from './reading.repository';
import { AlertModule } from 'src/alert/alert.module';
import { AutomaticControlModule } from 'src/automatic-control/automatic-control.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports:     [PrismaModule, AlertModule, AutomaticControlModule, WebsocketModule],
  controllers: [ReadingController],
  providers:   [ReadingService, ReadingRepository],
  exports:     [ReadingService, ReadingRepository],
})
export class ReadingModule {}