import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';

@Module({
  providers: [WebSocketGateway, WebsocketService],
  exports: [WebsocketService],
})
export class WebsocketModule {}