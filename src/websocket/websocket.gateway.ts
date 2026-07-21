import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebsocketService } from './websocket.service';
import { SensorDataWsDto } from 'src/reading/reading.dto';

@NestWebSocketGateway({
  cors: { origin: '*' },
  allowEIO3: true,
})
export class WebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);

  constructor(
    @Inject(forwardRef(() => WebsocketService))
    private readonly websocketService: WebsocketService,
  ) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // ─── Frontend se une a la room de su planta ─────────────────────────────────

  @SubscribeMessage('join:plant')
  handleJoinPlant(
    @MessageBody() data: { userPlantId: number },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `plant:${data.userPlantId}`;
    client.join(room);
    this.logger.log(`Cliente ${client.id} se unió a room ${room}`);
    client.emit('joined', { room });
  }

  @SubscribeMessage('leave:plant')
  handleLeavePlant(
    @MessageBody() data: { userPlantId: number },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `plant:${data.userPlantId}`;
    client.leave(room);
    this.logger.log(`Cliente ${client.id} abandonó room ${room}`);
  }

  @SubscribeMessage('sensor:data')
  async handleSensorData(
    @MessageBody() data: SensorDataWsDto,
    @ConnectedSocket() _client: Socket,
  ): Promise<void> {
    await this.websocketService.handleSensorData(data);
  }

  emitToRoom(room: string, event: string, data: unknown): void {
    this.server.to(room).emit(event, data);
  }
}
