import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';

export interface SensorPayload {
  userPlantId: number;
  boxId: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightHours: number;
  waterLevel: number;
  timestamp: Date;
}

export interface CommandPayload {
  userPlantId: number;
  boxId: number;
  pump: boolean;
  light: boolean;
  reason: string;
}

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);
  private readonly THROTTLE_MS = 5000;

  // Guarda el último dato por userPlantId
  private pendingReadings = new Map<number, SensorPayload>();
  private throttleTimers  = new Map<number, NodeJS.Timeout>();

  constructor(private readonly gateway: WebSocketGateway) {}

  emitReading(payload: SensorPayload): void {
    this.pendingReadings.set(payload.userPlantId, payload);

    if (this.throttleTimers.has(payload.userPlantId)) return;

    const timer = setTimeout(() => {
      const latest = this.pendingReadings.get(payload.userPlantId);
      if (latest) {
        this.gateway.emitToRoom(
          `plant:${payload.userPlantId}`,
          'reading:new',
          latest,
        );
        this.logger.log(`[WS] reading:new emitido para userPlant ${payload.userPlantId}`);
        this.pendingReadings.delete(payload.userPlantId);
      }
      this.throttleTimers.delete(payload.userPlantId);
    }, this.THROTTLE_MS);

    this.throttleTimers.set(payload.userPlantId, timer);
  }

  emitCommand(payload: CommandPayload): void {
    // Los comandos se emiten inmediatamente — sin throttling
    this.gateway.emitToRoom(
      `plant:${payload.userPlantId}`,
      'command:control',
      payload,
    );
    this.logger.log(
      `[WS] command:control emitido para userPlant ${payload.userPlantId} — pump: ${payload.pump}`,
    );
  }
}