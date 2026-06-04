import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@NestWebSocketGateway({
  cors: {
    origin: '*', // En producción pon la URL del frontend
  },
  namespace: '/ws',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // El frontend se une a la room de su planta
  // Emite desde el frontend: { userPlantId: 5 }
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

  // Método interno que usa WebsocketService para emitir a una room
  emitToRoom(room: string, event: string, data: unknown): void {
    this.server.to(room).emit(event, data);
  }
}