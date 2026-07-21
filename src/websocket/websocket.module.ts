import { forwardRef, Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';
import { AlertModule } from 'src/alert/alert.module';
import { AutomaticControlModule } from 'src/automatic-control/automatic-control.module';
import { ReadingModule } from 'src/reading/reading.module';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { SensorsModule } from 'src/sensors/sensors.module';

@Module({
  imports: [
    AlertModule,
    AutomaticControlModule,
    PrismaModule,
    forwardRef(() => ReadingModule),
    forwardRef(() => SensorsModule),
  ],
  providers: [WebSocketGateway, WebsocketService],
  exports: [WebsocketService, WebSocketGateway],
})
export class WebsocketModule {}
