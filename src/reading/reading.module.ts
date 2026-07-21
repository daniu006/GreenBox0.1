import { Module } from '@nestjs/common';
import { ReadingController } from './reading.controller';
import { ReadingService } from './reading.service';
import { ReadingRepository } from './reading.repository';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { forwardRef } from '@nestjs/common';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WebsocketModule)],
  controllers: [ReadingController],
  providers: [ReadingService, ReadingRepository],
  exports: [ReadingService, ReadingRepository],
})
export class ReadingModule {}
